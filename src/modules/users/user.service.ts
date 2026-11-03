import { prisma } from '../../lib/prisma';
import { revokeAllRefreshTokens } from '../../services/token.service';
import { ApiError } from '../../utils/ApiError';
import { todayIST } from '../../utils/dates';
import { presentUser } from './user.presenter';
import type { UpdateProfileInput } from './user.schemas';

export async function getMe(id: string) {
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) throw ApiError.notFound('Account');
  return presentUser(u);
}

export async function updateMe(id: string, input: UpdateProfileInput) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });

  if (input.phone) {
    const clash = await prisma.user.findFirst({
      where: { id: { not: id }, phone: { is: { countryCode: input.phone.countryCode, nationalNumber: input.phone.nationalNumber } } },
      select: { id: true },
    });
    if (clash) throw ApiError.conflict('This phone number is already registered', 'PHONE_TAKEN');
  }

  const samePhone =
    input.phone && user.phone && input.phone.countryCode === user.phone.countryCode && input.phone.nationalNumber === user.phone.nationalNumber;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      fullName: input.fullName,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      avatarUrl: input.avatarUrl,
      ...(input.preferences ? { preferences: { set: { ...user.preferences, ...input.preferences } } } : {}),
      // a new number must be re-verified through the OTP flow
      ...(input.phone
        ? {
            phone: { set: { ...input.phone, isVerified: samePhone ? (user.phone?.isVerified ?? false) : false } },
            ...(samePhone ? {} : { verification: { set: { ...user.verification, isPhoneVerified: false } } }),
          }
        : {}),
    },
  });
  return presentUser(updated);
}

/** Soft-delete (GDPR-style erasure keeps financial records): blocked while bookings are still upcoming. */
export async function deleteMe(id: string) {
  const today = todayIST();
  const [stays, packages, experiences] = await Promise.all([
    prisma.stayBooking.count({ where: { userId: id, bookingStatus: { in: ['pending', 'confirmed', 'checked_in'] }, checkOutDate: { gte: today } } }),
    prisma.packageBooking.count({ where: { userId: id, bookingStatus: { in: ['pending', 'confirmed'] }, endDate: { gte: today } } }),
    prisma.experienceBooking.count({ where: { userId: id, bookingStatus: { in: ['pending', 'reserved', 'checked_in'] }, activityDate: { gte: today } } }),
  ]);
  if (stays + packages + experiences > 0) {
    throw ApiError.conflict('You have upcoming bookings. Cancel them or wait until they are completed before deleting your account.', 'HAS_UPCOMING_BOOKINGS');
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: {
        status: 'deleted',
        fullName: 'Deleted user',
        email: `deleted+${id}@deleted.mahastays.invalid`,
        passwordHash: null,
        phone: { unset: true },
        avatarUrl: null,
        dateOfBirth: null,
        authProviderId: null,
        verification: { set: { ...user.verification, isEmailVerified: false, isPhoneVerified: false, governmentIdNumberMasked: null } },
      },
    }),
    prisma.wishlist.deleteMany({ where: { userId: id } }),
  ]);
  await revokeAllRefreshTokens(id, 'user');
  return { deleted: true };
}
