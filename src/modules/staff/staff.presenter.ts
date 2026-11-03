import type { Admin, SubAdmin, SuperAdmin } from '@prisma/client';

export function presentAdmin(a: Admin) {
  return {
    id: a.id,
    _id: a.id,
    adminCode: a.adminCode,
    fullName: a.fullName,
    email: a.email,
    phone: a.phone,
    roleTitle: a.roleTitle,
    permissions: a.permissions,
    security: { isTwoFactorEnabled: a.security.isTwoFactorEnabled, allowedIpWhitelists: a.security.allowedIpWhitelists },
    status: a.status,
    lastLoginAt: a.lastLoginAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export function presentSubAdmin(s: SubAdmin) {
  return {
    id: s.id,
    _id: s.id,
    subAdminCode: s.subAdminCode,
    fullName: s.fullName,
    email: s.email,
    phone: s.phone,
    department: s.department,
    permissions: s.permissions,
    assignedRegions: s.assignedRegions,
    supervisorAdminId: s.supervisorAdminId,
    status: s.status,
    lastActiveAt: s.lastActiveAt,
    lastLoginAt: s.lastLoginAt,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export function presentSuperAdmin(s: SuperAdmin) {
  return {
    id: s.id,
    _id: s.id,
    username: s.username,
    fullName: s.fullName,
    email: s.email,
    phone: s.phone,
    security: { isTwoFactorEnabled: s.security.isTwoFactorEnabled, isTwoFactorEnforced: s.isTwoFactorEnforced },
    status: s.status,
    lastLoginAt: s.lastLoginAt,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}
