import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getStaff, requireStaff } from '../../middlewares/staff';
import { audit } from '../../services/audit.service';
import { sendEmail } from '../../services/notification.service';
import { templates } from '../../services/notification.templates';
import { resolveDocumentUrl } from '../../services/storage.service';
import { revokeAllRefreshTokens } from '../../services/token.service';
import { prisma } from '../../lib/prisma';
import { ok, created } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { todayIST } from '../../utils/dates';
import { pageMeta, paginationSchema, skipTake } from '../../utils/pagination';
import { bodyOf, optionalTrimmed } from '../../utils/zod';
import { hashPassword } from '../../utils/crypto';
import { generateActorCode } from '../../utils/codes';
import { getPlatformConfig } from '../../services/platformConfig.service';
import { presentVendor } from '../vendors/vendor.presenter';

export const adminVendorRouter = Router();

async function resolveVendor(idOrCode: string) {
  if (!idOrCode) return null;
  const isHex24 = /^[a-f\d]{24}$/i.test(idOrCode);
  if (isHex24) {
    const v = await prisma.vendor.findUnique({ where: { id: idOrCode } });
    if (v) return v;
  }
  return await prisma.vendor.findFirst({
    where: {
      OR: [
        { id: idOrCode },
        { vendorCode: idOrCode },
        { vendorCode: { equals: idOrCode, mode: 'insensitive' } },
        { email: { equals: idOrCode, mode: 'insensitive' } },
      ],
    },
  });
}

const read = requireStaff({ admin: true, sub_admin: true });
const approve = requireStaff({ admin: true, sub_admin: true });
const restrict = requireStaff({ admin: true, sub_admin: true });

const listQuery = paginationSchema.extend({
  status: z.enum(['active', 'pending_approval', 'on_hold', 'blacklisted']).optional(),
  verification: z.enum(['pending', 'under_review', 'approved', 'rejected']).optional(),
  q: z.string().trim().max(100).optional(),
});

function vendorWhere(q: z.infer<typeof listQuery>): Prisma.VendorWhereInput {
  const contains = q.q ? { contains: q.q, mode: 'insensitive' as const } : undefined;
  return {
    ...(q.status ? { status: q.status } : {}),
    ...(q.verification ? { compliance: { is: { verificationStatus: q.verification } } } : {}),
    ...(contains ? { OR: [{ businessName: contains }, { displayName: contains }, { email: contains }, { vendorCode: contains }] } : {}),
  };
}

adminVendorRouter.get('/', read, async (req, res) => {
  const q = listQuery.parse(req.query);
  const where = vendorWhere(q);
  const [total, rows] = await Promise.all([prisma.vendor.count({ where }), prisma.vendor.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(q) })]);
  ok(res, rows.map((v) => presentVendor(v, { bank: 'hidden' })), pageMeta(q, total));
});

const createVendorByAdminSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(128),
  businessName: z.string().trim().min(2).max(150).optional(),
  displayName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().optional(),
  category: z.enum(['property_host', 'activity_operator', 'integrated_resort']).default('property_host'),
  businessType: z.enum(['individual', 'proprietorship', 'private_limited', 'partnership']).default('individual'),
  status: z.enum(['active', 'pending_approval']).default('active'),
});

/** Create vendor account directly from Admin portal with email & password */
adminVendorRouter.post('/', read, async (req, res) => {
  const staff = getStaff(req);
  const input = createVendorByAdminSchema.parse(bodyOf(req));
  const email = input.email.toLowerCase();

  if (await prisma.vendor.findUnique({ where: { email }, select: { id: true } })) {
    throw ApiError.conflict('A vendor account with this email already exists', 'EMAIL_TAKEN');
  }

  const businessName = input.businessName || email.split('@')[0];
  const displayName = input.displayName || businessName;
  const phone = input.phone || '';
  const vendorCode = await generateActorCode('VND');
  const passwordHash = await hashPassword(input.password);
  const config = await getPlatformConfig();

  const vendor = await prisma.vendor.create({
    data: {
      vendorCode,
      businessType: input.businessType,
      category: input.category,
      businessName,
      displayName,
      displayRole: input.category === 'activity_operator' ? 'Activity Host' : 'Property Host & Owner',
      experienceSummary: '',
      avatarUrl: undefined,
      email,
      phone,
      passwordHash,
      contact: {
        primaryContactPerson: displayName,
        registeredOfficeAddress: {
          addressLine1: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India',
        },
      },
      compliance: {
        panNumber: '',
        verificationStatus: 'pending',
      },
      commissionTerms: {
        commissionType: 'percentage',
        propertyCommissionRatePercent: config.defaultCommission.propertyCommissionRatePercent,
        packageCommissionRatePercent: config.defaultCommission.packageCommissionRatePercent,
        experienceCommissionRatePercent: config.defaultCommission.experienceCommissionRatePercent,
        payoutCycle: config.defaultCommission.payoutCycle,
      },
      status: input.status,
    },
  });

  await audit({
    actor: { id: staff.id, role: staff.role },
    action: 'CREATE_VENDOR_BY_ADMIN',
    targetEntity: 'Vendor',
    targetId: vendor.id,
    newState: { email: vendor.email, businessName: vendor.businessName, category: vendor.category },
    req,
  });

  created(res, presentVendor(vendor, { bank: 'hidden' }));
});

/** Queue of applications waiting for a decision (oldest first). */
adminVendorRouter.get('/pending', read, async (req, res) => {
  const q = listQuery.parse(req.query);
  const where: Prisma.VendorWhereInput = { compliance: { is: { verificationStatus: q.verification ?? 'under_review' } } };
  const [total, rows] = await Promise.all([prisma.vendor.count({ where }), prisma.vendor.findMany({ where, orderBy: { createdAt: 'asc' }, ...skipTake(q) })]);
  ok(res, rows.map((v) => presentVendor(v, { bank: 'hidden' })), pageMeta(q, total));
});

adminVendorRouter.get('/:id', read, async (req, res) => {
  const staff = getStaff(req);
  const v = await resolveVendor(String(req.params.id));
  if (!v) throw ApiError.notFound('Vendor');
  // Bank numbers: admins need them to verify the account; support staff only with an explicit permission. Every reveal is audited.
  const canSeeBank = staff.role !== 'sub_admin' || !!staff.subAdminPermissions?.canViewVendorBankDetails;
  if (canSeeBank && v.banking) {
    await audit({ actor: { id: staff.id, role: staff.role }, action: 'VIEW_VENDOR_BANK', targetEntity: 'Vendor', targetId: v.id, req });
  }
  const presented = presentVendor(v, { bank: canSeeBank ? 'full' : 'masked' });
  ok(res, {
    ...presented,
    compliance: {
      ...presented.compliance,
      identityProofUrl: await resolveDocumentUrl(v.compliance.identityProofUrl),
      businessProofUrl: await resolveDocumentUrl(v.compliance.businessProofUrl),
    },
  });
});

const verifySchema = z
  .object({ decision: z.enum(['approve', 'reject']), reason: optionalTrimmed(300), verifyBank: z.boolean().default(false) })
  .refine((b) => b.decision !== 'reject' || !!b.reason, { message: 'A reason is required when rejecting', path: ['reason'] });

adminVendorRouter.post('/:id/verify', approve, async (req, res) => {
  const staff = getStaff(req);
  const input = verifySchema.parse(bodyOf(req));
  const v = await resolveVendor(String(req.params.id));
  if (!v) throw ApiError.notFound('Vendor');
  const id = v.id;
  const c = v.compliance;
  const verifiedByAdminId = staff.id && /^[a-f\d]{24}$/i.test(staff.id) ? staff.id : undefined;

  let updated;
  if (input.decision === 'approve') {
    updated = await prisma.vendor.update({
      where: { id },
      data: {
        status: 'active',
        compliance: {
          set: {
            panNumber: c?.panNumber || '',
            gstin: c?.gstin || null,
            tourismLicenseNumber: c?.tourismLicenseNumber || null,
            identityProofUrl: c?.identityProofUrl || null,
            businessProofUrl: c?.businessProofUrl || null,
            verificationStatus: 'approved',
            rejectionReason: null,
            verifiedAt: new Date(),
            verifiedByAdminId,
          },
        },
        ...(input.verifyBank && v.banking ? { banking: { set: { ...v.banking, isAccountVerified: true } } } : {}),
      },
    });
  } else {
    updated = await prisma.vendor.update({
      where: { id },
      data: {
        compliance: {
          set: {
            panNumber: c?.panNumber || '',
            gstin: c?.gstin || null,
            tourismLicenseNumber: c?.tourismLicenseNumber || null,
            identityProofUrl: c?.identityProofUrl || null,
            businessProofUrl: c?.businessProofUrl || null,
            verificationStatus: 'rejected',
            rejectionReason: input.reason ?? 'KYC rejected by administrator',
          },
        },
      },
    });
  }
  await audit({
    actor: { id: staff.id, role: staff.role },
    action: input.decision === 'approve' ? 'APPROVE_VENDOR_KYC' : 'REJECT_VENDOR_KYC',
    targetEntity: 'Vendor',
    targetId: id,
    previousState: { verificationStatus: c.verificationStatus, status: v.status },
    newState: { decision: input.decision, reason: input.reason, bankVerified: input.verifyBank },
    req,
  });
  try {
    const mail = templates.vendorDecision({ name: v.displayName || v.businessName, approved: input.decision === 'approve', reason: input.reason });
    void sendEmail({ to: v.email, subject: mail.subject, html: mail.html });
  } catch {
    // Non-blocking notification
  }
  ok(res, presentVendor(updated, { bank: 'masked' }));
});

const patchKycSchema = z.object({
  approve: z.boolean(),
  reason: optionalTrimmed(300),
});

adminVendorRouter.patch('/:id/kyc', approve, async (req, res) => {
  const staff = getStaff(req);
  const input = patchKycSchema.parse(bodyOf(req));
  const v = await resolveVendor(String(req.params.id));
  if (!v) throw ApiError.notFound('Vendor');
  const id = v.id;
  const c = v.compliance;
  const verifiedByAdminId = staff.id && /^[a-f\d]{24}$/i.test(staff.id) ? staff.id : undefined;

  let updated;
  if (input.approve) {
    updated = await prisma.vendor.update({
      where: { id },
      data: {
        status: 'active',
        compliance: {
          set: {
            panNumber: c?.panNumber || '',
            gstin: c?.gstin || null,
            tourismLicenseNumber: c?.tourismLicenseNumber || null,
            identityProofUrl: c?.identityProofUrl || null,
            businessProofUrl: c?.businessProofUrl || null,
            verificationStatus: 'approved',
            rejectionReason: null,
            verifiedAt: new Date(),
            verifiedByAdminId,
          },
        },
      },
    });
  } else {
    updated = await prisma.vendor.update({
      where: { id },
      data: {
        compliance: {
          set: {
            panNumber: c?.panNumber || '',
            gstin: c?.gstin || null,
            tourismLicenseNumber: c?.tourismLicenseNumber || null,
            identityProofUrl: c?.identityProofUrl || null,
            businessProofUrl: c?.businessProofUrl || null,
            verificationStatus: 'rejected',
            rejectionReason: input.reason ?? 'KYC rejected by administrator',
          },
        },
      },
    });
  }
  await audit({
    actor: { id: staff.id, role: staff.role },
    action: input.approve ? 'APPROVE_VENDOR_KYC' : 'REJECT_VENDOR_KYC',
    targetEntity: 'Vendor',
    targetId: id,
    previousState: { verificationStatus: c.verificationStatus, status: v.status },
    newState: { approve: input.approve, reason: input.reason },
    req,
  });
  if (input.approve) {
    try {
      const mail = templates.vendorDecision({ name: v.displayName || v.businessName, approved: true });
      void sendEmail({ to: v.email, subject: mail.subject, html: mail.html });
    } catch {
      // Non-blocking notification
    }
  }
  ok(res, presentVendor(updated, { bank: 'masked' }));
});

/** Quick one-click approve & activate vendor route */
adminVendorRouter.post('/:id/approve', approve, async (req, res) => {
  const staff = getStaff(req);
  const v = await resolveVendor(String(req.params.id));
  if (!v) throw ApiError.notFound('Vendor');
  const id = v.id;
  const c = v.compliance;
  const verifiedByAdminId = staff.id && /^[a-f\d]{24}$/i.test(staff.id) ? staff.id : undefined;

  const updated = await prisma.vendor.update({
    where: { id },
    data: {
      status: 'active',
      compliance: {
        set: {
          panNumber: c?.panNumber || '',
          gstin: c?.gstin || null,
          tourismLicenseNumber: c?.tourismLicenseNumber || null,
          identityProofUrl: c?.identityProofUrl || null,
          businessProofUrl: c?.businessProofUrl || null,
          verificationStatus: 'approved',
          rejectionReason: null,
          verifiedAt: new Date(),
          verifiedByAdminId,
        },
      },
    },
  });

  await audit({
    actor: { id: staff.id, role: staff.role },
    action: 'APPROVE_VENDOR_KYC',
    targetEntity: 'Vendor',
    targetId: id,
    previousState: { verificationStatus: c.verificationStatus, status: v.status },
    newState: { verificationStatus: 'approved', status: 'active' },
    req,
  });

  try {
    const mail = templates.vendorDecision({ name: v.displayName || v.businessName, approved: true });
    void sendEmail({ to: v.email, subject: mail.subject, html: mail.html });
  } catch {
    // Non-blocking notification
  }

  ok(res, presentVendor(updated, { bank: 'masked' }));
});

adminVendorRouter.post('/:id/bank/verify', approve, async (req, res) => {
  const staff = getStaff(req);
  const { verified } = z.object({ verified: z.boolean() }).parse(bodyOf(req));
  const v = await resolveVendor(String(req.params.id));
  if (!v) throw ApiError.notFound('Vendor');
  const id = v.id;
  const currentBanking = v.banking || {
    accountHolderName: v.displayName || v.businessName,
    accountNumberEnc: '',
    accountNumberLast4: '0000',
    ifscCode: 'MAHA0000001',
    bankName: 'Verified Account',
    branchName: 'Main',
    isAccountVerified: false,
  };
  const updated = await prisma.vendor.update({
    where: { id },
    data: { banking: { set: { ...currentBanking, isAccountVerified: verified } } },
  });
  await audit({ actor: { id: staff.id, role: staff.role }, action: verified ? 'VERIFY_VENDOR_BANK' : 'UNVERIFY_VENDOR_BANK', targetEntity: 'Vendor', targetId: id, req });
  ok(res, presentVendor(updated, { bank: 'masked' }).banking);
});

adminVendorRouter.patch('/:id/bank', approve, async (req, res) => {
  const staff = getStaff(req);
  const { verified } = z.object({ verified: z.boolean() }).parse(bodyOf(req));
  const v = await resolveVendor(String(req.params.id));
  if (!v) throw ApiError.notFound('Vendor');
  const id = v.id;
  const currentBanking = v.banking || {
    accountHolderName: v.displayName || v.businessName,
    accountNumberEnc: '',
    accountNumberLast4: '0000',
    ifscCode: 'MAHA0000001',
    bankName: 'Verified Account',
    branchName: 'Main',
    isAccountVerified: false,
  };
  const updated = await prisma.vendor.update({
    where: { id },
    data: { banking: { set: { ...currentBanking, isAccountVerified: verified } } },
  });
  await audit({ actor: { id: staff.id, role: staff.role }, action: verified ? 'VERIFY_VENDOR_BANK' : 'UNVERIFY_VENDOR_BANK', targetEntity: 'Vendor', targetId: id, req });
  ok(res, presentVendor(updated, { bank: 'masked' }).banking);
});

const statusSchema = z
  .object({ status: z.enum(['active', 'on_hold', 'blacklisted']), reason: optionalTrimmed(300) })
  .refine((b) => b.status === 'active' || !!b.reason, { message: 'A reason is required when holding or blacklisting a vendor', path: ['reason'] });

/** Hold / blacklist cascades: live listings go offline immediately, blacklisted vendors are signed out everywhere. */
adminVendorRouter.patch('/:id/status', restrict, async (req, res) => {
  const staff = getStaff(req);
  const { status, reason } = statusSchema.parse(bodyOf(req));
  const v = await resolveVendor(String(req.params.id));
  if (!v) throw ApiError.notFound('Vendor');
  const id = v.id;
  if (status === 'active' && v.compliance.verificationStatus !== 'approved') {
    throw ApiError.conflict('Approve the vendor KYC before activating the account', 'KYC_NOT_APPROVED');
  }

  const ops: Prisma.PrismaPromise<unknown>[] = [prisma.vendor.update({ where: { id }, data: { status } })];
  if (status !== 'active') {
    ops.push(
      prisma.property.updateMany({ where: { vendorId: id, status: 'active' }, data: { status: 'inactive' } }),
      prisma.package.updateMany({ where: { vendorId: id, status: 'active' }, data: { status: 'inactive' } }),
      prisma.experience.updateMany({ where: { vendorId: id, status: 'active' }, data: { status: 'inactive' } }),
    );
  }
  await prisma.$transaction(ops);
  if (status === 'blacklisted') await revokeAllRefreshTokens(id, 'vendor');

  const today = todayIST();
  const [stays, packages, experiences] = await Promise.all([
    prisma.stayBooking.count({ where: { vendorId: id, bookingStatus: { in: ['confirmed', 'checked_in'] }, checkOutDate: { gte: today } } }),
    prisma.packageBooking.count({ where: { vendorId: id, bookingStatus: 'confirmed', endDate: { gte: today } } }),
    prisma.experienceBooking.count({ where: { vendorId: id, bookingStatus: { in: ['reserved', 'checked_in'] }, activityDate: { gte: today } } }),
  ]);
  await audit({
    actor: { id: staff.id, role: staff.role },
    action: `VENDOR_${status.toUpperCase()}`,
    targetEntity: 'Vendor',
    targetId: id,
    previousState: { status: v.status },
    newState: { status, reason },
    req,
  });
  ok(res, { id, status, upcomingBookingsToHandle: { stays, packages, experiences } });
});

const updateVendorCommissionSchema = z
  .object({
    commissionType: z.enum(['percentage', 'fixed']).optional(),
    propertyCommissionRatePercent: z.number().min(0).max(100).optional(),
    packageCommissionRatePercent: z.number().min(0).max(100).optional(),
    experienceCommissionRatePercent: z.number().min(0).max(100).optional(),
    payoutCycle: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'Provide at least one field to update' });

/** Update custom commissions for a specific vendor across Stays, Packages & Experiences */
adminVendorRouter.put('/:id/commission', requireStaff({ admin: true }), async (req, res) => {
  const staff = getStaff(req);
  const input = updateVendorCommissionSchema.parse(bodyOf(req));
  const vendor = await resolveVendor(String(req.params.id));
  if (!vendor) throw ApiError.notFound('Vendor');
  const id = vendor.id;

  const merged = { ...vendor.commissionTerms, ...input };
  const updated = await prisma.vendor.update({
    where: { id },
    data: { commissionTerms: { set: merged } },
  });

  await audit({
    actor: { id: staff.id, role: staff.role },
    action: 'UPDATE_VENDOR_COMMISSION',
    targetEntity: 'Vendor',
    targetId: id,
    previousState: { commissionTerms: vendor.commissionTerms },
    newState: { commissionTerms: merged },
    req,
  });

  ok(res, presentVendor(updated, { bank: 'masked' }));
});

const updateVendorByAdminSchema = z.object({
  email: z.string().trim().email().optional(),
  password: z.string().min(6).max(128).optional(),
  businessName: z.string().trim().min(2).max(150).optional(),
  displayName: z.string().trim().min(2).max(100).optional(),
  displayRole: z.string().trim().max(100).optional(),
  phone: z.string().trim().optional(),
  category: z.enum(['property_host', 'activity_operator', 'integrated_resort']).optional(),
  businessType: z.enum(['individual', 'proprietorship', 'private_limited', 'partnership']).optional(),
  experienceSummary: z.string().trim().max(500).optional(),
  avatarUrl: z.string().trim().optional(),
  status: z.enum(['active', 'pending_approval', 'on_hold', 'blacklisted']).optional(),
  panNumber: z.string().trim().optional(),
  gstin: z.string().trim().optional(),
  tourismLicenseNumber: z.string().trim().optional(),
  primaryContactPerson: z.string().trim().optional(),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  pincode: z.string().trim().optional(),
});

/** Update vendor details including email, password, profile, address & compliance by Admin */
const handleUpdateVendor = async (req: any, res: any) => {
  const staff = getStaff(req);
  const input = updateVendorByAdminSchema.parse(bodyOf(req));
  const existing = await resolveVendor(String(req.params.id));
  if (!existing) throw ApiError.notFound('Vendor');
  const id = existing.id;

  const updateData: Prisma.VendorUpdateInput = {};

  if (input.email && input.email.toLowerCase() !== existing.email.toLowerCase()) {
    const newEmail = input.email.toLowerCase();
    const clash = await prisma.vendor.findUnique({ where: { email: newEmail } });
    if (clash && clash.id !== id) {
      throw ApiError.conflict('A vendor account with this email already exists', 'EMAIL_TAKEN');
    }
    updateData.email = newEmail;
  }

  if (input.password && input.password.trim().length > 0) {
    updateData.passwordHash = await hashPassword(input.password);
    await revokeAllRefreshTokens(id, 'vendor');
  }

  if (input.businessName) updateData.businessName = input.businessName;
  if (input.displayName) updateData.displayName = input.displayName;
  if (input.displayRole) updateData.displayRole = input.displayRole;
  if (input.phone) updateData.phone = input.phone;
  if (input.category) updateData.category = input.category;
  if (input.businessType) updateData.businessType = input.businessType;
  if (input.experienceSummary !== undefined) updateData.experienceSummary = input.experienceSummary;
  if (input.avatarUrl) updateData.avatarUrl = input.avatarUrl;
  if (input.status) updateData.status = input.status;

  if (input.panNumber || input.gstin !== undefined || input.tourismLicenseNumber !== undefined) {
    updateData.compliance = {
      set: {
        ...existing.compliance,
        ...(input.panNumber ? { panNumber: input.panNumber } : {}),
        ...(input.gstin !== undefined ? { gstin: input.gstin } : {}),
        ...(input.tourismLicenseNumber !== undefined ? { tourismLicenseNumber: input.tourismLicenseNumber } : {}),
      },
    };
  }

  if (
    input.primaryContactPerson ||
    input.addressLine1 ||
    input.addressLine2 !== undefined ||
    input.city ||
    input.state ||
    input.pincode
  ) {
    updateData.contact = {
      set: {
        ...existing.contact,
        primaryContactPerson: input.primaryContactPerson || existing.contact?.primaryContactPerson || input.displayName || existing.displayName,
        registeredOfficeAddress: {
          ...existing.contact?.registeredOfficeAddress,
          ...(input.addressLine1 ? { addressLine1: input.addressLine1 } : {}),
          ...(input.addressLine2 !== undefined ? { addressLine2: input.addressLine2 } : {}),
          ...(input.city ? { city: input.city } : {}),
          ...(input.state ? { state: input.state } : {}),
          ...(input.pincode ? { pincode: input.pincode } : {}),
          country: 'India',
        },
      },
    };
  }

  const updated = await prisma.vendor.update({
    where: { id },
    data: updateData,
  });

  await audit({
    actor: { id: staff.id, role: staff.role },
    action: 'UPDATE_VENDOR_PROFILE',
    targetEntity: 'Vendor',
    targetId: id,
    previousState: {
      email: existing.email,
      businessName: existing.businessName,
      phone: existing.phone,
    },
    newState: {
      email: updated.email,
      businessName: updated.businessName,
      phone: updated.phone,
      passwordChanged: Boolean(input.password),
    },
    req,
  });

  ok(res, presentVendor(updated, { bank: 'masked' }));
};

adminVendorRouter.patch('/:id', read, handleUpdateVendor);
adminVendorRouter.put('/:id', read, handleUpdateVendor);
