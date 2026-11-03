import type { Role } from '../../config/constants';
import { prisma } from '../../lib/prisma';
import { presentAdmin, presentSubAdmin, presentSuperAdmin } from '../staff/staff.presenter';
import { presentUser } from '../users/user.presenter';
import { presentVendor } from '../vendors/vendor.presenter';
import { ApiError } from '../../utils/ApiError';

/** Everything the login flow needs, normalised across the five actor collections. */
export interface LoginActor {
  id: string;
  role: Role;
  email: string;
  fullName: string;
  passwordHash: string | null;
  status: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  twoFactor?: { enabled: boolean; enforced: boolean; secretEnc: string | null };
  ipWhitelist?: string[];
  recoveryKeyHashes?: string[];
}

export function isStatusAllowed(role: Role, status: string): boolean {
  if (role === 'vendor') return status !== 'blacklisted'; // pending vendors may log in to finish KYC
  return status === 'active';
}

type Base = {
  id: string;
  email: string;
  passwordHash: string | null;
  status: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
};

const base = (role: Role, fullName: string, r: Base): LoginActor => ({
  id: r.id,
  role,
  email: r.email,
  fullName,
  passwordHash: r.passwordHash,
  status: r.status,
  failedLoginAttempts: r.failedLoginAttempts,
  lockedUntil: r.lockedUntil,
});

export async function findLoginActor(role: Role, email: string): Promise<LoginActor | null> {
  switch (role) {
    case 'user': {
      const u = await prisma.user.findUnique({ where: { email } });
      return u ? base(role, u.fullName, u) : null;
    }
    case 'vendor': {
      const v = await prisma.vendor.findUnique({ where: { email } });
      return v ? base(role, v.displayName, v) : null;
    }
    case 'sub_admin': {
      const s = await prisma.subAdmin.findUnique({ where: { email } });
      return s ? base(role, s.fullName, s) : null;
    }
    case 'admin': {
      const a = await prisma.admin.findUnique({ where: { email } });
      if (!a) return null;
      return {
        ...base(role, a.fullName, a),
        twoFactor: { enabled: a.security.isTwoFactorEnabled && !!a.security.twoFactorSecretEnc, enforced: false, secretEnc: a.security.twoFactorSecretEnc ?? null },
        ipWhitelist: a.security.allowedIpWhitelists,
      };
    }
    case 'super_admin': {
      const s = await prisma.superAdmin.findUnique({ where: { email } });
      if (!s) return null;
      return {
        ...base(role, s.fullName, s),
        twoFactor: { enabled: s.security.isTwoFactorEnabled && !!s.security.twoFactorSecretEnc, enforced: s.isTwoFactorEnforced, secretEnc: s.security.twoFactorSecretEnc ?? null },
        ipWhitelist: s.security.allowedIpWhitelists,
        recoveryKeyHashes: s.recoveryKeyHashes,
      };
    }
  }
}

export async function findLoginActorById(role: Role, id: string): Promise<LoginActor | null> {
  const email = await getActorEmail(role, id);
  return email ? findLoginActor(role, email) : null;
}

async function getActorEmail(role: Role, id: string): Promise<string | null> {
  switch (role) {
    case 'user':
      return (await prisma.user.findUnique({ where: { id }, select: { email: true } }))?.email ?? null;
    case 'vendor':
      return (await prisma.vendor.findUnique({ where: { id }, select: { email: true } }))?.email ?? null;
    case 'sub_admin':
      return (await prisma.subAdmin.findUnique({ where: { id }, select: { email: true } }))?.email ?? null;
    case 'admin':
      return (await prisma.admin.findUnique({ where: { id }, select: { email: true } }))?.email ?? null;
    case 'super_admin':
      return (await prisma.superAdmin.findUnique({ where: { id }, select: { email: true } }))?.email ?? null;
  }
}

export async function getActorStatus(role: Role, id: string): Promise<string | null> {
  switch (role) {
    case 'user':
      return (await prisma.user.findUnique({ where: { id }, select: { status: true } }))?.status ?? null;
    case 'vendor':
      return (await prisma.vendor.findUnique({ where: { id }, select: { status: true } }))?.status ?? null;
    case 'sub_admin':
      return (await prisma.subAdmin.findUnique({ where: { id }, select: { status: true } }))?.status ?? null;
    case 'admin':
      return (await prisma.admin.findUnique({ where: { id }, select: { status: true } }))?.status ?? null;
    case 'super_admin':
      return (await prisma.superAdmin.findUnique({ where: { id }, select: { status: true } }))?.status ?? null;
  }
}

/** Fields every actor collection shares — lets login bookkeeping stay a single code path. */
export interface ActorPatch {
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  lastLoginAt?: Date;
  passwordHash?: string;
}

export async function patchActor(role: Role, id: string, data: ActorPatch): Promise<void> {
  switch (role) {
    case 'user':
      await prisma.user.update({ where: { id }, data });
      break;
    case 'vendor':
      await prisma.vendor.update({ where: { id }, data });
      break;
    case 'sub_admin':
      await prisma.subAdmin.update({ where: { id }, data });
      break;
    case 'admin':
      await prisma.admin.update({ where: { id }, data });
      break;
    case 'super_admin':
      await prisma.superAdmin.update({ where: { id }, data });
      break;
  }
}

/** Role-specific profile for `GET /auth/me` and login responses. */
export async function getProfile(role: Role, id: string) {
  switch (role) {
    case 'user': {
      const u = await prisma.user.findUnique({ where: { id } });
      if (!u) throw ApiError.notFound('Account');
      return presentUser(u);
    }
    case 'vendor': {
      const v = await prisma.vendor.findUnique({ where: { id } });
      if (!v) throw ApiError.notFound('Account');
      return presentVendor(v);
    }
    case 'sub_admin': {
      const s = await prisma.subAdmin.findUnique({ where: { id } });
      if (!s) throw ApiError.notFound('Account');
      return presentSubAdmin(s);
    }
    case 'admin': {
      const a = await prisma.admin.findUnique({ where: { id } });
      if (!a) throw ApiError.notFound('Account');
      return presentAdmin(a);
    }
    case 'super_admin': {
      const s = await prisma.superAdmin.findUnique({ where: { id } });
      if (!s) throw ApiError.notFound('Account');
      return presentSuperAdmin(s);
    }
  }
}
