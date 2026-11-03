import type { ExperienceBooking, PackageBooking, PaymentStatus, Prisma, StayBooking } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { parseSlotStart, istDateTime } from '../../utils/dates';
import type { BookingKind } from './booking.schemas';

/** Per-kind status vocabulary (see schema.prisma). Centralised so the rest of the code stays kind-agnostic. */
export const STATUS = {
  stay: { paid: 'confirmed', done: 'checked_out', cancellable: ['pending', 'confirmed'], settled: ['checked_out', 'no_show'] },
  package: { paid: 'confirmed', done: 'completed', cancellable: ['pending', 'confirmed'], settled: ['completed'] },
  experience: { paid: 'reserved', done: 'completed', cancellable: ['pending', 'reserved'], settled: ['completed', 'no_show'] },
} as const satisfies Record<BookingKind, { paid: string; done: string; cancellable: readonly string[]; settled: readonly string[] }>;

export const ENTITY_LABEL: Record<BookingKind, string> = { stay: 'Stay booking', package: 'Package booking', experience: 'Experience booking' };

/** Kind-agnostic view of a booking — everything cancellation, payment and settlement logic needs. */
export interface BookingCore {
  kind: BookingKind;
  id: string;
  reference: string;
  userId: string;
  vendorId: string;
  status: string;
  paymentStatus: PaymentStatus;
  grandTotalInr: number;
  taxableAmountInr: number;
  commissionRatePercent: number;
  commissionAmountInr: number;
  vendorShareInr: number;
  memberDiscountInr: number;
  holdExpiresAt: Date | null;
  payoutId: string | null;
  billingState: string | null;
  title: string;
  /** Instant the service starts (used by the cancellation window). */
  startsAt: Date;
  /** Policy overrides from the listing (hours / late-fee %). */
  policy: { freeCancellationHours?: number | null; lateCancellationFeePercent?: number | null };
  raw: StayBooking | PackageBooking | ExperienceBooking;
}

export async function loadBookingCore(kind: BookingKind, id: string): Promise<BookingCore | null> {
  switch (kind) {
    case 'stay': {
      const b = await prisma.stayBooking.findUnique({ where: { id }, include: { property: { select: { name: true, policies: true } } } });
      if (!b) return null;
      return {
        kind,
        id: b.id,
        reference: b.bookingReference,
        userId: b.userId,
        vendorId: b.vendorId,
        status: b.bookingStatus,
        paymentStatus: b.paymentStatus,
        grandTotalInr: b.grandTotalInr,
        taxableAmountInr: b.taxableAmountInr,
        commissionRatePercent: b.commissionRatePercent,
        commissionAmountInr: b.commissionAmountInr,
        vendorShareInr: b.vendorShareInr,
        memberDiscountInr: b.pricing.memberDiscount,
        holdExpiresAt: b.holdExpiresAt,
        payoutId: b.payoutId,
        billingState: b.billingState,
        title: `${b.property.name} — ${b.roomName}`,
        startsAt: istDateTime(b.checkInDate, b.property.policies.checkInTime),
        policy: {
          freeCancellationHours: b.property.policies.freeCancellationHours,
          lateCancellationFeePercent: b.property.policies.lateCancellationFeePercent,
        },
        raw: b,
      };
    }
    case 'package': {
      const b = await prisma.packageBooking.findUnique({ where: { id }, include: { package: { select: { title: true } } } });
      if (!b) return null;
      return {
        kind,
        id: b.id,
        reference: b.bookingReference,
        userId: b.userId,
        vendorId: b.vendorId,
        status: b.bookingStatus,
        paymentStatus: b.paymentStatus,
        grandTotalInr: b.grandTotalInr,
        taxableAmountInr: b.taxableAmountInr,
        commissionRatePercent: b.commissionRatePercent,
        commissionAmountInr: b.commissionAmountInr,
        vendorShareInr: b.vendorShareInr,
        memberDiscountInr: b.pricing.memberDiscount,
        holdExpiresAt: b.holdExpiresAt,
        payoutId: b.payoutId,
        billingState: b.billingState,
        title: `${b.package.title} — ${b.tierName}`,
        startsAt: istDateTime(b.startDate, '12:00'),
        policy: {},
        raw: b,
      };
    }
    case 'experience': {
      const b = await prisma.experienceBooking.findUnique({ where: { id }, include: { experience: { select: { title: true } } } });
      if (!b) return null;
      return {
        kind,
        id: b.id,
        reference: b.bookingReference,
        userId: b.userId,
        vendorId: b.vendorId,
        status: b.bookingStatus,
        paymentStatus: b.paymentStatus,
        grandTotalInr: b.grandTotalInr,
        taxableAmountInr: b.taxableAmountInr,
        commissionRatePercent: b.commissionRatePercent,
        commissionAmountInr: b.commissionAmountInr,
        vendorShareInr: b.vendorShareInr,
        memberDiscountInr: b.pricing.memberDiscount,
        holdExpiresAt: b.holdExpiresAt,
        payoutId: b.payoutId,
        billingState: b.billingState,
        title: `${b.experience.title} — ${b.slotTime}`,
        startsAt: istDateTime(b.activityDate, parseSlotStart(b.slotTime)),
        policy: {},
        raw: b,
      };
    }
  }
}

export async function requireBookingCore(kind: BookingKind, id: string): Promise<BookingCore> {
  const core = await loadBookingCore(kind, id);
  if (!core) throw ApiError.notFound(ENTITY_LABEL[kind]);
  return core;
}

/**
 * Guarded update of a booking (see lib/tx.ts). `allowed` restricts the transition to bookings currently in one of
 * those statuses. The `never` casts live here and ONLY here: the three booking collections share field names
 * (bookingStatus, paymentStatus, cancellation, ...) but not identical enum types.
 */
export function guardedBookingUpdate(
  kind: BookingKind,
  id: string,
  allowed: readonly string[] | null,
  data: Record<string, unknown>,
): Prisma.PrismaPromise<unknown> {
  const where = { id, ...(allowed ? { bookingStatus: { in: [...allowed] } } : {}) } as never;
  switch (kind) {
    case 'stay':
      return prisma.stayBooking.update({ where, data: data as never });
    case 'package':
      return prisma.packageBooking.update({ where, data: data as never });
    case 'experience':
      return prisma.experienceBooking.update({ where, data: data as never });
  }
}

/* ───────────────────────── atomic side-effect operations ───────────────────────── */

export const vendorWallet = {
  creditPending: (vendorId: string, amount: number) =>
    prisma.vendor.update({ where: { id: vendorId }, data: { walletPendingInr: { increment: amount } } }),
  /** pending → available (service delivered; money can be paid out) */
  clear: (vendorId: string, amount: number) =>
    prisma.vendor.update({ where: { id: vendorId }, data: { walletPendingInr: { decrement: amount }, walletAvailableInr: { increment: amount } } }),
  /** cancellation: reverse the pending credit and (optionally) credit the vendor's share of a retained penalty as available */
  reverse: (vendorId: string, pendingAmount: number, availableAmount: number) =>
    prisma.vendor.update({
      where: { id: vendorId },
      data: { walletPendingInr: { decrement: pendingAmount }, walletAvailableInr: { increment: availableAmount } },
    }),
};

export const userMetrics = {
  onConfirmed: (userId: string, grandTotal: number, discount: number) =>
    prisma.user.update({
      where: { id: userId },
      data: { totalBookingsCount: { increment: 1 }, totalSpentInr: { increment: grandTotal }, totalDiscountSavedInr: { increment: discount } },
    }),
  onRefund: (userId: string, refunded: number) =>
    prisma.user.update({ where: { id: userId }, data: { totalSpentInr: { decrement: refunded } } }),
  onStayCompleted: (userId: string) => prisma.user.update({ where: { id: userId }, data: { completedStaysCount: { increment: 1 } } }),
};
