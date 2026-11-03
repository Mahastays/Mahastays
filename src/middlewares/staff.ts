import type { Request, RequestHandler } from 'express';
import type { AdminPermissionKey, SubAdminPermissionKey } from '../config/constants';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import type { StaffContext } from '../types/auth';
import { tagAccess } from './access';
import { authenticate } from './authenticate';
import { chain } from './chain';

/**
 * Per-role rule for a staff route:
 *   true            → role may call it
 *   '<flag>'        → role may call it only if that permission flag is true on its record
 *   (omitted)       → role may not call it
 * super_admin is always allowed.
 */
export interface StaffRules {
  sub_admin?: true | SubAdminPermissionKey;
  admin?: true | AdminPermissionKey;
}

const notActive = () => ApiError.forbidden('Account is not active', 'ACCOUNT_INACTIVE');
const missing = (flag: string) => ApiError.forbidden(`Missing permission: ${flag}`, 'PERMISSION_DENIED');

/** Loads the LIVE staff record (so permission changes apply immediately) and enforces the route's rule. */
async function authorizeStaff(req: Request, rules: StaffRules): Promise<void> {
  const auth = req.auth;
  if (!auth) throw ApiError.unauthorized();

  switch (auth.role) {
    case 'super_admin': {
      const sa = await prisma.superAdmin.findUnique({ where: { id: auth.id } });
      if (!sa || sa.status !== 'active') throw notActive();
      req.staff = { role: 'super_admin', id: sa.id, fullName: sa.fullName };
      return;
    }
    case 'admin': {
      const rule = rules.admin;
      if (rule === undefined) throw ApiError.forbidden();
      const admin = await prisma.admin.findUnique({ where: { id: auth.id } });
      if (!admin || admin.status !== 'active') throw notActive();
      if (rule !== true && !admin.permissions[rule]) throw missing(rule);
      req.staff = { role: 'admin', id: admin.id, fullName: admin.fullName, adminPermissions: admin.permissions };
      return;
    }
    case 'sub_admin': {
      const rule = rules.sub_admin;
      if (rule === undefined) throw ApiError.forbidden();
      const sub = await prisma.subAdmin.findUnique({ where: { id: auth.id } });
      if (!sub || sub.status !== 'active') throw notActive();
      if (rule !== true && !sub.permissions[rule]) throw missing(rule);
      req.staff = {
        role: 'sub_admin',
        id: sub.id,
        fullName: sub.fullName,
        subAdminPermissions: sub.permissions,
        supervisorAdminId: sub.supervisorAdminId,
        assignedRegions: sub.assignedRegions,
      };
      void prisma.subAdmin.update({ where: { id: sub.id }, data: { lastActiveAt: new Date() } }).catch(() => undefined);
      return;
    }
    default:
      throw ApiError.forbidden();
  }
}

const labelOf = (rules: StaffRules): string =>
  [
    'super_admin',
    rules.admin === undefined ? null : rules.admin === true ? 'admin' : `admin[${rules.admin}]`,
    rules.sub_admin === undefined ? null : rules.sub_admin === true ? 'sub_admin' : `sub_admin[${rules.sub_admin}]`,
  ]
    .filter(Boolean)
    .join(' | ');

/** Authenticates, then applies the per-role rules above. */
export function requireStaff(rules: StaffRules = { admin: true, sub_admin: true }): RequestHandler {
  return tagAccess(
    chain(authenticate, async (req, _res, next) => {
      await authorizeStaff(req, rules);
      next();
    }),
    labelOf(rules),
  );
}

export function getStaff(req: { staff?: StaffContext }): StaffContext {
  if (!req.staff) throw ApiError.unauthorized();
  return req.staff;
}

/** Whether this staff member may see unmasked customer contact data (RBAC matrix). */
export function canSeeFullContact(staff: StaffContext): boolean {
  return staff.role === 'admin' || staff.role === 'super_admin';
}
