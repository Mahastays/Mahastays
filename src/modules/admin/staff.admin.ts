import { Router, type RequestHandler } from 'express';
import type { Admin, AdminPermissions, Prisma, SubAdmin, SubAdminPermissions } from '@prisma/client';
import { z } from 'zod';
import { ADMIN_PERMISSION_KEYS } from '../../config/constants';
import { getStaff } from '../../middlewares/staff';
import { requireMasterPin } from '../../middlewares/masterPin';
import { audit } from '../../services/audit.service';
import { revokeAllRefreshTokens } from '../../services/token.service';
import { prisma } from '../../lib/prisma';
import { ok, created } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { generateActorCode } from '../../utils/codes';
import { hashPassword } from '../../utils/crypto';
import { pageMeta, paginationSchema, skipTake } from '../../utils/pagination';
import * as v from '../../utils/zod';
import type { StaffContext } from '../../types/auth';
import { presentAdmin, presentSubAdmin } from '../staff/staff.presenter';

/* ───────────────────────── shared ───────────────────────── */

/** Staff e-mails must be unique across all three staff collections (the login looks them up in order). */
async function assertStaffEmailFree(email: string): Promise<void> {
  const [a, b, c] = await Promise.all([
    prisma.superAdmin.findUnique({ where: { email }, select: { id: true } }),
    prisma.admin.findUnique({ where: { email }, select: { id: true } }),
    prisma.subAdmin.findUnique({ where: { email }, select: { id: true } }),
  ]);
  if (a || b || c) throw ApiError.conflict('A staff account with this email already exists', 'EMAIL_TAKEN');
}

const phone = z.string().trim().regex(/^\+?\d{8,15}$/, 'Phone must be 8-15 digits');
const flag = z.boolean();

/* ───────────────────────── sub-admins ───────────────────────── */

const SUB_BASE: SubAdminPermissions = {
  canViewBookings: false,
  canInitiateCustomerRefunds: false,
  maxRefundCeilingInr: 0,
  canApproveReviews: false,
  canFlagFraudulentListings: false,
  canManageInquiryTickets: false,
  canViewVendorBankDetails: false,
  canEditListingDescriptions: false,
  canTriggerCustomerNotifications: false,
};

/** Sensible least-privilege starting points per department; explicit flags in the request override them. */
const DEPARTMENT_PRESETS: Record<SubAdmin['department'], Partial<SubAdminPermissions>> = {
  customer_support: { canViewBookings: true, canManageInquiryTickets: true, canTriggerCustomerNotifications: true },
  content_moderation: { canApproveReviews: true, canFlagFraudulentListings: true, canEditListingDescriptions: true },
  booking_operations: { canViewBookings: true, canInitiateCustomerRefunds: true, maxRefundCeilingInr: 5000, canTriggerCustomerNotifications: true },
  dispute_handling: { canViewBookings: true, canInitiateCustomerRefunds: true, maxRefundCeilingInr: 10000, canManageInquiryTickets: true },
};

const subPermissionsSchema = z
  .object({
    canViewBookings: flag,
    canInitiateCustomerRefunds: flag,
    maxRefundCeilingInr: z.number().int().min(0).max(100_000),
    canApproveReviews: flag,
    canFlagFraudulentListings: flag,
    canManageInquiryTickets: flag,
    canViewVendorBankDetails: flag,
    canEditListingDescriptions: flag,
    canTriggerCustomerNotifications: flag,
  })
  .partial();

const DEPARTMENTS = ['customer_support', 'content_moderation', 'booking_operations', 'dispute_handling'] as const;

const createSubAdminSchema = z.object({
  fullName: v.trimmed(2, 120),
  email: v.email,
  phone,
  password: v.password,
  department: z.enum(DEPARTMENTS),
  permissions: subPermissionsSchema.optional(),
  assignedRegions: z.array(v.trimmed(1, 80)).max(30).default([]),
  /** Required when a super-admin creates the account; admins always supervise their own sub-admins. */
  supervisorAdminId: v.objectId.optional(),
});

const updateSubAdminSchema = z
  .object({
    fullName: v.trimmed(2, 120),
    phone,
    department: z.enum(DEPARTMENTS),
    permissions: subPermissionsSchema,
    assignedRegions: z.array(v.trimmed(1, 80)).max(30),
    status: z.enum(['active', 'inactive', 'suspended']),
  })
  .partial()
  .refine((b) => Object.keys(b).length > 0, { message: 'Provide at least one field to update' });

async function loadManagedSubAdmin(creator: StaffContext, id: string): Promise<SubAdmin> {
  const s = await prisma.subAdmin.findUnique({ where: { id } });
  // admins may only manage the sub-admins they supervise; 404 (not 403) so ids can't be probed
  if (!s || (creator.role === 'admin' && s.supervisorAdminId !== creator.id)) throw ApiError.notFound('Sub-admin');
  return s;
}

/** Router factory: mounted under /admin/subadmins (admins with canManageSubAdmins) and /superadmin/subadmins (super-admin). */
export function makeSubAdminRouter(guard: RequestHandler): Router {
  const r = Router();

  r.get('/', guard, async (req, res) => {
    const staff = getStaff(req);
    const q = paginationSchema.extend({ department: z.enum(DEPARTMENTS).optional(), status: z.enum(['active', 'inactive', 'suspended']).optional() }).parse(req.query);
    const where: Prisma.SubAdminWhereInput = {
      ...(staff.role === 'admin' ? { supervisorAdminId: staff.id } : {}),
      ...(q.department ? { department: q.department } : {}),
      ...(q.status ? { status: q.status } : {}),
    };
    const [total, rows] = await Promise.all([prisma.subAdmin.count({ where }), prisma.subAdmin.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(q) })]);
    ok(res, rows.map(presentSubAdmin), pageMeta(q, total));
  });

  r.post('/', guard, async (req, res) => {
    const staff = getStaff(req);
    const input = createSubAdminSchema.parse(v.bodyOf(req));
    let supervisorAdminId: string;
    if (staff.role === 'admin') supervisorAdminId = staff.id;
    else {
      if (!input.supervisorAdminId) throw ApiError.unprocessable('supervisorAdminId is required when a super-admin creates a sub-admin', undefined, 'SUPERVISOR_REQUIRED');
      if (!(await prisma.admin.findUnique({ where: { id: input.supervisorAdminId }, select: { id: true } }))) throw ApiError.notFound('Supervisor admin');
      supervisorAdminId = input.supervisorAdminId;
    }
    await assertStaffEmailFree(input.email);
    const created_ = await prisma.subAdmin.create({
      data: {
        subAdminCode: await generateActorCode('SUB'),
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash: await hashPassword(input.password),
        department: input.department,
        permissions: { ...SUB_BASE, ...DEPARTMENT_PRESETS[input.department], ...input.permissions },
        assignedRegions: input.assignedRegions,
        supervisorAdminId,
      },
    });
    await audit({ actor: { id: staff.id, role: staff.role }, action: 'CREATE_SUBADMIN', targetEntity: 'SubAdmin', targetId: created_.id, newState: { department: input.department, permissions: created_.permissions }, req });
    created(res, presentSubAdmin(created_));
  });

  r.get('/:id', guard, async (req, res) => {
    ok(res, presentSubAdmin(await loadManagedSubAdmin(getStaff(req), v.objectId.parse(req.params.id))));
  });

  r.put('/:id', guard, async (req, res) => {
    const staff = getStaff(req);
    const current = await loadManagedSubAdmin(staff, v.objectId.parse(req.params.id));
    const input = updateSubAdminSchema.parse(v.bodyOf(req));
    const updated = await prisma.subAdmin.update({
      where: { id: current.id },
      data: {
        fullName: input.fullName,
        phone: input.phone,
        department: input.department,
        assignedRegions: input.assignedRegions,
        status: input.status,
        ...(input.permissions ? { permissions: { set: { ...current.permissions, ...input.permissions } } } : {}),
      },
    });
    if (input.status && input.status !== 'active') await revokeAllRefreshTokens(current.id, 'sub_admin');
    await audit({ actor: { id: staff.id, role: staff.role }, action: 'UPDATE_SUBADMIN', targetEntity: 'SubAdmin', targetId: current.id, previousState: { permissions: current.permissions, status: current.status }, newState: { permissions: updated.permissions, status: updated.status }, req });
    ok(res, presentSubAdmin(updated));
  });

  r.post('/:id/reset-password', guard, async (req, res) => {
    const staff = getStaff(req);
    const current = await loadManagedSubAdmin(staff, v.objectId.parse(req.params.id));
    const { newPassword } = z.object({ newPassword: v.password }).parse(v.bodyOf(req));
    await prisma.subAdmin.update({ where: { id: current.id }, data: { passwordHash: await hashPassword(newPassword), failedLoginAttempts: 0, lockedUntil: null } });
    await revokeAllRefreshTokens(current.id, 'sub_admin');
    await audit({ actor: { id: staff.id, role: staff.role }, action: 'RESET_SUBADMIN_PASSWORD', targetEntity: 'SubAdmin', targetId: current.id, req });
    ok(res, { reset: true });
  });

  return r;
}

/* ───────────────────────── admins (super-admin only) ───────────────────────── */

const adminPermissionsSchema = z.object(Object.fromEntries(ADMIN_PERMISSION_KEYS.map((k) => [k, flag])) as Record<(typeof ADMIN_PERMISSION_KEYS)[number], z.ZodBoolean>).partial();

const ADMIN_BASE = Object.fromEntries(ADMIN_PERMISSION_KEYS.map((k) => [k, false])) as unknown as AdminPermissions;

const createAdminSchema = z.object({
  fullName: v.trimmed(2, 120),
  email: v.email,
  phone,
  password: v.password,
  roleTitle: v.trimmed(2, 120),
  permissions: adminPermissionsSchema.optional(),
  allowedIpWhitelists: z.array(z.string().trim().min(3).max(64)).max(20).default([]),
});

const updateAdminSchema = z
  .object({
    fullName: v.trimmed(2, 120),
    phone,
    roleTitle: v.trimmed(2, 120),
    permissions: adminPermissionsSchema,
    allowedIpWhitelists: z.array(z.string().trim().min(3).max(64)).max(20),
    status: z.enum(['active', 'suspended']),
  })
  .partial()
  .refine((b) => Object.keys(b).length > 0, { message: 'Provide at least one field to update' });

export function makeAdminsRouter(guard: RequestHandler): Router {
  const r = Router();
  const pin = requireMasterPin();

  const load = async (id: string): Promise<Admin> => {
    const a = await prisma.admin.findUnique({ where: { id } });
    if (!a) throw ApiError.notFound('Admin');
    return a;
  };

  r.get('/', guard, async (req, res) => {
    const q = paginationSchema.parse(req.query);
    const [total, rows] = await Promise.all([prisma.admin.count(), prisma.admin.findMany({ orderBy: { createdAt: 'desc' }, ...skipTake(q) })]);
    ok(res, rows.map(presentAdmin), pageMeta(q, total));
  });

  r.post('/', guard, pin, async (req, res) => {
    const staff = getStaff(req);
    const input = createAdminSchema.parse(v.bodyOf(req));
    await assertStaffEmailFree(input.email);
    const admin = await prisma.admin.create({
      data: {
        adminCode: await generateActorCode('ADM'),
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash: await hashPassword(input.password),
        roleTitle: input.roleTitle,
        permissions: { ...ADMIN_BASE, ...input.permissions },
        security: { isTwoFactorEnabled: false, allowedIpWhitelists: input.allowedIpWhitelists },
      },
    });
    await audit({ actor: { id: staff.id, role: staff.role }, action: 'CREATE_ADMIN', targetEntity: 'Admin', targetId: admin.id, newState: { roleTitle: admin.roleTitle, permissions: admin.permissions }, req });
    created(res, presentAdmin(admin));
  });

  r.get('/:id', guard, async (req, res) => {
    ok(res, presentAdmin(await load(v.objectId.parse(req.params.id))));
  });

  r.put('/:id', guard, pin, async (req, res) => {
    const staff = getStaff(req);
    const current = await load(v.objectId.parse(req.params.id));
    const input = updateAdminSchema.parse(v.bodyOf(req));
    const updated = await prisma.admin.update({
      where: { id: current.id },
      data: {
        fullName: input.fullName,
        phone: input.phone,
        roleTitle: input.roleTitle,
        status: input.status,
        ...(input.permissions ? { permissions: { set: { ...current.permissions, ...input.permissions } } } : {}),
        ...(input.allowedIpWhitelists ? { security: { set: { ...current.security, allowedIpWhitelists: input.allowedIpWhitelists } } } : {}),
      },
    });
    if (input.status === 'suspended') await revokeAllRefreshTokens(current.id, 'admin');
    await audit({ actor: { id: staff.id, role: staff.role }, action: 'UPDATE_ADMIN', targetEntity: 'Admin', targetId: current.id, previousState: { permissions: current.permissions, status: current.status }, newState: { permissions: updated.permissions, status: updated.status }, req });
    ok(res, presentAdmin(updated));
  });

  r.post('/:id/reset-password', guard, pin, async (req, res) => {
    const staff = getStaff(req);
    const current = await load(v.objectId.parse(req.params.id));
    const { newPassword } = z.object({ newPassword: v.password }).parse(v.bodyOf(req));
    await prisma.admin.update({ where: { id: current.id }, data: { passwordHash: await hashPassword(newPassword), failedLoginAttempts: 0, lockedUntil: null } });
    await revokeAllRefreshTokens(current.id, 'admin');
    await audit({ actor: { id: staff.id, role: staff.role }, action: 'RESET_ADMIN_PASSWORD', targetEntity: 'Admin', targetId: current.id, req });
    ok(res, { reset: true });
  });

  /** Lost authenticator: clears 2FA so the admin can enrol again (they must sign in with password, then set up 2FA). */
  r.post('/:id/reset-2fa', guard, pin, async (req, res) => {
    const staff = getStaff(req);
    const current = await load(v.objectId.parse(req.params.id));
    await prisma.admin.update({ where: { id: current.id }, data: { security: { set: { ...current.security, isTwoFactorEnabled: false, twoFactorSecretEnc: null } } } });
    await revokeAllRefreshTokens(current.id, 'admin');
    await audit({ actor: { id: staff.id, role: staff.role }, action: 'RESET_ADMIN_2FA', targetEntity: 'Admin', targetId: current.id, req });
    ok(res, { reset: true });
  });

  return r;
}
