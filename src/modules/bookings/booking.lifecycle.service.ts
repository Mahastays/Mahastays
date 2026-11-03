import { prisma } from '../../lib/prisma';
import { runGuarded } from '../../lib/tx';
import { ApiError } from '../../utils/ApiError';
import { todayIST } from '../../utils/dates';
import { STATUS, guardedBookingUpdate, loadBookingCore, requireBookingCore, userMetrics, vendorWallet, type BookingCore } from './booking.core';
import { BOOKING_KINDS, type BookingKind } from './booking.schemas';
import { cancellationBySystem } from './booking.common';

/** Booking must belong to the vendor (404 otherwise, so ids can't be probed). */
async function ownedCore(kind: BookingKind, vendorId: string, id: string): Promise<BookingCore> {
  const core = await requireBookingCore(kind, id);
  if (core.vendorId !== vendorId) throw ApiError.notFound('Booking');
  return core;
}

const startDateOf = (core: BookingCore): string => {
  const raw = core.raw;
  return 'checkInDate' in raw ? raw.checkInDate : 'startDate' in raw ? raw.startDate : raw.activityDate;
};

function assertStarted(core: BookingCore) {
  if (todayIST() < startDateOf(core)) throw ApiError.conflict('This booking has not started yet', 'TOO_EARLY');
}

/**
 * Delivered (or forfeited) service: status change + wallet release (pending → available) in ONE atomic batch.
 * Returns false when someone else already settled it.
 */
export async function settleBooking(core: BookingCore, newStatus: string, allowed: readonly string[], extra: Record<string, unknown> = {}): Promise<boolean> {
  return runGuarded([
    guardedBookingUpdate(core.kind, core.id, allowed, { bookingStatus: newStatus, ...extra }),
    vendorWallet.clear(core.vendorId, core.vendorShareInr),
    ...(core.kind === 'stay' && newStatus === 'checked_out' ? [userMetrics.onStayCompleted(core.userId)] : []),
  ]);
}

const stale = () => ApiError.conflict('This booking is not in a state that allows this action', 'INVALID_STATE');

/* ───────────────────────────── vendor actions ───────────────────────────── */

export async function stayAction(vendorId: string, id: string, action: 'check_in' | 'check_out' | 'no_show') {
  const core = await ownedCore('stay', vendorId, id);
  assertStarted(core);
  const now = new Date();
  let ok: boolean;
  if (action === 'check_in') ok = await runGuarded([guardedBookingUpdate('stay', id, ['confirmed'], { bookingStatus: 'checked_in', checkedInAt: now })]);
  else if (action === 'check_out') ok = await settleBooking(core, 'checked_out', ['confirmed', 'checked_in'], { checkedOutAt: now });
  else ok = await settleBooking(core, 'no_show', ['confirmed']);
  if (!ok) throw stale();
  return { id, action, status: action === 'check_in' ? 'checked_in' : action === 'check_out' ? 'checked_out' : 'no_show' };
}

export async function packageAction(vendorId: string, id: string, _action: 'complete') {
  const core = await ownedCore('package', vendorId, id);
  assertStarted(core);
  if (!(await settleBooking(core, 'completed', ['confirmed']))) throw stale();
  return { id, action: 'complete' as const, status: 'completed' };
}

export async function experienceAction(vendorId: string, id: string, action: 'check_in' | 'complete' | 'no_show') {
  const core = await ownedCore('experience', vendorId, id);
  assertStarted(core);
  let ok: boolean;
  if (action === 'check_in') ok = await runGuarded([guardedBookingUpdate('experience', id, ['reserved'], { bookingStatus: 'checked_in' })]);
  else if (action === 'complete') ok = await settleBooking(core, 'completed', ['reserved', 'checked_in']);
  else ok = await settleBooking(core, 'no_show', ['reserved']);
  if (!ok) throw stale();
  return { id, action, status: action === 'check_in' ? 'checked_in' : action === 'complete' ? 'completed' : 'no_show' };
}

/**
 * Redeems a free-activity pass bundled with a package. Allowed for the package's vendor or the vendor that
 * runs the activity, only while the trip is running.
 */
export async function redeemVoucher(vendorId: string, voucherCode: string) {
  const booking = await prisma.packageBooking.findFirst({
    where: { bookingStatus: 'confirmed', freeActivityPasses: { some: { passVoucherCode: voucherCode } } },
    include: { user: { select: { fullName: true } }, package: { select: { title: true } } },
  });
  if (!booking) throw ApiError.notFound('Voucher');
  const pass = booking.freeActivityPasses.find((p) => p.passVoucherCode === voucherCode);
  if (!pass) throw ApiError.notFound('Voucher');

  let allowed = booking.vendorId === vendorId;
  if (!allowed && pass.activityId) {
    const exp = await prisma.experience.findUnique({ where: { id: pass.activityId }, select: { vendorId: true } });
    allowed = exp?.vendorId === vendorId;
  }
  if (!allowed) throw ApiError.notFound('Voucher');

  const today = todayIST();
  if (today < booking.startDate || today > booking.endDate) {
    throw ApiError.conflict(`This voucher is valid from ${booking.startDate} to ${booking.endDate}`, 'VOUCHER_NOT_VALID_TODAY');
  }
  if (pass.isRedeemed) throw ApiError.conflict('This voucher has already been redeemed', 'VOUCHER_REDEEMED');

  // The filter includes isRedeemed:false → two simultaneous scans cannot both succeed.
  const res = await prisma.packageBooking.updateMany({
    where: { id: booking.id, freeActivityPasses: { some: { passVoucherCode: voucherCode, isRedeemed: false } } },
    data: { freeActivityPasses: { updateMany: { where: { passVoucherCode: voucherCode }, data: { isRedeemed: true, redeemedAt: new Date() } } } },
  });
  if (res.count === 0) throw ApiError.conflict('This voucher has already been redeemed', 'VOUCHER_REDEEMED');

  return {
    voucherCode,
    activityName: pass.activityName,
    guestName: booking.user.fullName,
    packageTitle: booking.package.title,
    bookingReference: booking.bookingReference,
    redeemedAt: new Date(),
  };
}

/* ───────────────────────────── background jobs ───────────────────────────── */

async function expiredPendingIds(kind: BookingKind, now: Date): Promise<string[]> {
  const where = { bookingStatus: 'pending' as const, holdExpiresAt: { lt: now } };
  const select = { id: true } as const;
  const rows =
    kind === 'stay'
      ? await prisma.stayBooking.findMany({ where, select, take: 200 })
      : kind === 'package'
        ? await prisma.packageBooking.findMany({ where, select, take: 200 })
        : await prisma.experienceBooking.findMany({ where, select, take: 200 });
  return rows.map((r) => r.id);
}

/** Releases inventory held by reservations whose payment window lapsed. */
export async function expireUnpaidHolds(now = new Date()): Promise<number> {
  let released = 0;
  for (const kind of BOOKING_KINDS) {
    for (const id of await expiredPendingIds(kind, now)) {
      const ok = await runGuarded([
        guardedBookingUpdate(kind, id, ['pending'], { bookingStatus: 'cancelled', holdExpiresAt: null, cancellation: cancellationBySystem('Payment was not completed in time') }),
        prisma.payment.updateMany({ where: { bookingType: kind, bookingId: id, status: 'initiated' }, data: { status: 'failed', failureReason: 'HOLD_EXPIRED' } }),
      ]);
      if (ok) released += 1;
    }
  }
  return released;
}

async function overdueIds(kind: BookingKind, today: string): Promise<string[]> {
  const select = { id: true } as const;
  const rows =
    kind === 'stay'
      ? await prisma.stayBooking.findMany({ where: { bookingStatus: { in: ['confirmed', 'checked_in'] }, checkOutDate: { lt: today } }, select, take: 200 })
      : kind === 'package'
        ? await prisma.packageBooking.findMany({ where: { bookingStatus: 'confirmed', endDate: { lt: today } }, select, take: 200 })
        : await prisma.experienceBooking.findMany({ where: { bookingStatus: { in: ['reserved', 'checked_in'] }, activityDate: { lt: today } }, select, take: 200 });
  return rows.map((r) => r.id);
}

/** Bookings whose date has passed are marked delivered, which releases the vendor's earnings and enables reviews. */
export async function autoCompleteBookings(today = todayIST()): Promise<number> {
  let done = 0;
  for (const kind of BOOKING_KINDS) {
    for (const id of await overdueIds(kind, today)) {
      const core = await loadBookingCore(kind, id);
      if (!core) continue;
      const allowed = [STATUS[kind].paid, 'checked_in'];
      const extra = kind === 'stay' ? { checkedOutAt: new Date() } : {};
      if (await settleBooking(core, STATUS[kind].done, allowed, extra)) done += 1;
    }
  }
  return done;
}
