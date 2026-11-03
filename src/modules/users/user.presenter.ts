import type { User } from '@prisma/client';
import { omit } from '../../utils/object';

/** API shape of the spec's `IUser` (counters re-nested under `metrics`, secrets removed). */
export function presentUser(u: User) {
  const base = omit(
    u,
    'passwordHash',
    'failedLoginAttempts',
    'lockedUntil',
    'totalBookingsCount',
    'completedStaysCount',
    'totalSpentInr',
    'reviewsWrittenCount',
    'totalDiscountSavedInr',
    'authProviderId',
  );
  return {
    ...base,
    _id: u.id,
    membership: { ...u.membership, totalDiscountSavedInr: u.totalDiscountSavedInr },
    metrics: {
      totalBookingsCount: u.totalBookingsCount,
      completedStaysCount: u.completedStaysCount,
      totalSpentInr: u.totalSpentInr,
      reviewsWrittenCount: u.reviewsWrittenCount,
    },
  };
}

export type PresentedUser = ReturnType<typeof presentUser>;

/** Minimal customer snapshot for vendors / support staff. */
export function presentCustomerContact(
  u: Pick<User, 'id' | 'fullName' | 'email' | 'phone'>,
  mode: 'full' | 'masked' | 'name_only',
) {
  if (mode === 'name_only') return { id: u.id, fullName: u.fullName };
  const phone = u.phone ? `${u.phone.countryCode}${u.phone.nationalNumber}` : null;
  if (mode === 'full') return { id: u.id, fullName: u.fullName, email: u.email, phone };
  const [name, domain] = u.email.split('@');
  return {
    id: u.id,
    fullName: u.fullName,
    email: domain ? `${name.slice(0, 2)}***@${domain}` : '***',
    phone: phone ? phone.replace(/\d(?=\d{4})/g, '*') : null,
  };
}
