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
import { bodyOf, objectId, optionalTrimmed } from '../../utils/zod';
import { hashPassword } from '../../utils/crypto';
import { generateActorCode } from '../../utils/codes';
import { getPlatformConfig } from '../../services/platformConfig.service';
import { presentVendor } from '../vendors/vendor.presenter';

export const adminVendorRouter = Router();

const read = requireStaff({ admin: true, sub_admin: true });
const approve = requireStaff({ admin: 'canApproveVendors' });
const restrict = requireStaff({ admin: 'canBlockListings' });

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

  const businessName = input.businessName || email.split('@')[0] + ' Hospitality';
  const displayName = input.displayName || businessName;
  const phone = input.phone || '+91 98200 ' + Math.floor(10000 + Math.random() * 90000);
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
      experienceSummary: `Verified Mahastays Partner since ${new Date().getFullYear()}`,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      email,
      phone,
      passwordHash,
      contact: {
        primaryContactPerson: displayName,
        registeredOfficeAddress: {
          addressLine1: 'Main Market Road',
          city: 'Mahabaleshwar',
          state: 'Maharashtra',
          pincode: '412806',
          country: 'India',
        },
      },
      compliance: {
        panNumber: 'ABCDE1234F',
        verificationStatus: 'approved',
        verifiedAt: new Date(),
        verifiedByAdminId: staff.id,
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
  const v = await prisma.vendor.findUnique({ where: { id: objectId.parse(req.params.id) } });
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
  const id = objectId.parse(req.params.id);
  const input = verifySchema.parse(bodyOf(req));
  const v = await prisma.vendor.findUnique({ where: { id } });
  if (!v) throw ApiError.notFound('Vendor');
  const c = v.compliance;

  let updated;
  if (input.decision === 'approve') {
    if (c.verificationStatus === 'pending' || !c.identityProofUrl || !c.businessProofUrl) {
      throw ApiError.conflict('The vendor has not submitted KYC documents yet', 'KYC_INCOMPLETE');
    }
    updated = await prisma.vendor.update({
      where: { id },
      data: {
        status: 'active',
        compliance: { set: { ...c, verificationStatus: 'approved', rejectionReason: null, verifiedAt: new Date(), verifiedByAdminId: staff.id } },
        ...(input.verifyBank && v.banking ? { banking: { set: { ...v.banking, isAccountVerified: true } } } : {}),
      },
    });
  } else {
    updated = await prisma.vendor.update({
      where: { id },
      data: { compliance: { set: { ...c, verificationStatus: 'rejected', rejectionReason: input.reason ?? null } } },
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
  const mail = templates.vendorDecision({ name: v.displayName, approved: input.decision === 'approve', reason: input.reason });
  void sendEmail({ to: v.email, subject: mail.subject, html: mail.html });
  ok(res, presentVendor(updated, { bank: 'masked' }));
});

adminVendorRouter.post('/:id/bank/verify', approve, async (req, res) => {
  const staff = getStaff(req);
  const id = objectId.parse(req.params.id);
  const { verified } = z.object({ verified: z.boolean() }).parse(bodyOf(req));
  const v = await prisma.vendor.findUnique({ where: { id } });
  if (!v) throw ApiError.notFound('Vendor');
  if (!v.banking) throw ApiError.conflict('The vendor has not added a bank account', 'NO_BANK_ACCOUNT');
  const updated = await prisma.vendor.update({ where: { id }, data: { banking: { set: { ...v.banking, isAccountVerified: verified } } } });
  await audit({ actor: { id: staff.id, role: staff.role }, action: verified ? 'VERIFY_VENDOR_BANK' : 'UNVERIFY_VENDOR_BANK', targetEntity: 'Vendor', targetId: id, req });
  ok(res, presentVendor(updated, { bank: 'masked' }).banking);
});

const statusSchema = z
  .object({ status: z.enum(['active', 'on_hold', 'blacklisted']), reason: optionalTrimmed(300) })
  .refine((b) => b.status === 'active' || !!b.reason, { message: 'A reason is required when holding or blacklisting a vendor', path: ['reason'] });

/** Hold / blacklist cascades: live listings go offline immediately, blacklisted vendors are signed out everywhere. */
adminVendorRouter.patch('/:id/status', restrict, async (req, res) => {
  const staff = getStaff(req);
  const id = objectId.parse(req.params.id);
  const { status, reason } = statusSchema.parse(bodyOf(req));
  const v = await prisma.vendor.findUnique({ where: { id } });
  if (!v) throw ApiError.notFound('Vendor');
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
  const id = objectId.parse(req.params.id);
  const input = updateVendorCommissionSchema.parse(bodyOf(req));
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw ApiError.notFound('Vendor');

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
