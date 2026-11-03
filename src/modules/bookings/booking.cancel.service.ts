import type { Request } from 'express';
import { prisma } from '../../lib/prisma';
import { runGuarded } from '../../lib/tx';
import { audit } from '../../services/audit.service';
import { sendEmail } from '../../services/notification.service';
import { templates } from '../../services/notification.templates';
import { getPlatformConfig } from '../../services/platformConfig.service';
import { ApiError } from '../../utils/ApiError';
import type { StaffContext } from '../../types/auth';
import { dispatchRefund, newPendingRefundId } from '../payments/refund.service';
import { STATUS, guardedBookingUpdate, requireBookingCore, userMetrics, vendorWallet, type BookingCore } from './booking.core';
import { computeCancellation, type CancelActor as CancelledBy, type CancellationOutcome } from './cancellation.engine';
import type { BookingKind } from './booking.schemas';

export type CancelActor = { role: 'user'; id: string } | { role: 'vendor'; id: string } | { role: 'staff'; staff: StaffContext };

/** Staff may also cancel a booking that is already in progress (checked in). */
const STAFF_EXTRA: Record<BookingKind, string[]> = { stay: ['checked_in'], package: [], experience: ['checked_in'] };

async function resolvePolicy(core: BookingCore) {
  const cfg = await getPlatformConfig();
  return {
    freeCancellationHours: core.policy.freeCancellationHours ?? cfg.cancellationWindowRules.defaultFreeCancellationHours,
    lateFeePercent: core.policy.lateCancellationFeePercent ?? cfg.cancellationWindowRules.lateCancellationFeePercent,
  };
}

/** Who is cancelling, normalised for the policy engine; throws if the actor may not touch this booking. */
function authorize(core: BookingCore, actor: CancelActor): CancelledBy {
  if (actor.role === 'user') {
    if (core.userId !== actor.id) throw ApiError.notFound('Booking');
    return 'user';
  }
  if (actor.role === 'vendor') {
    if (core.vendorId !== actor.id) throw ApiError.notFound('Booking');
    return 'vendor';
  }
  const s = actor.staff;
  if (s.role === 'sub_admin' && !s.subAdminPermissions?.canInitiateCustomerRefunds) throw ApiError.forbidden('Missing permission: canInitiateCustomerRefunds', 'PERMISSION_DENIED');
  if (s.role === 'admin' && !s.adminPermissions?.canProcessOverridesAndDisputes) throw ApiError.forbidden('Missing permission: canProcessOverridesAndDisputes', 'PERMISSION_DENIED');
  return 'admin';
}

function cancellableStatuses(core: BookingCore, actor: CancelActor): string[] {
  return [...STATUS[core.kind].cancellable, ...(actor.role === 'staff' ? STAFF_EXTRA[core.kind] : [])];
}

async function evaluate(core: BookingCore, actor: CancelActor, overrideRefundInr?: number) {
  const cancelledBy = authorize(core, actor);
  const allowed = cancellableStatuses(core, actor);
  if (!allowed.includes(core.status)) throw ApiError.conflict(`A booking that is "${core.status}" cannot be cancelled`, 'NOT_CANCELLABLE');
  if (actor.role === 'staff' && overrideRefundInr !== undefined && actor.staff.role === 'sub_admin') {
    throw ApiError.forbidden('Only admins can override the refund amount', 'PERMISSION_DENIED');
  }

  const policy = await resolvePolicy(core);
  const paidInr = core.paymentStatus === 'paid' ? core.grandTotalInr : 0;
  const outcome = computeCancellation({
    now: new Date(),
    startsAt: core.startsAt,
    grandTotalInr: core.grandTotalInr,
    paidInr,
    cancelledBy,
    freeCancellationHours: policy.freeCancellationHours,
    lateFeePercent: policy.lateFeePercent,
    overrideRefundInr,
  });

  if (actor.role === 'staff' && actor.staff.role === 'sub_admin') {
    const ceiling = actor.staff.subAdminPermissions?.maxRefundCeilingInr ?? 0;
    if (outcome.refundAmountInr > ceiling) {
      throw ApiError.forbidden(`This refund (₹${outcome.refundAmountInr}) exceeds your approval limit (₹${ceiling}). Escalate to an admin.`, 'REFUND_CEILING_EXCEEDED');
    }
  }
  return { cancelledBy, allowed, policy, paidInr, outcome };
}

/** "If I cancel now, what happens?" — no side effects. */
export async function previewCancellation(kind: BookingKind, id: string, actor: CancelActor) {
  const core = await requireBookingCore(kind, id);
  const { outcome, policy, paidInr } = await evaluate(core, actor);
  return { bookingReference: core.reference, status: core.status, paidInr, ...outcome, policy: { freeCancellationHours: policy.freeCancellationHours, lateCancellationFeePercent: policy.lateFeePercent } };
}

export async function cancelBooking(
  kind: BookingKind,
  id: string,
  actor: CancelActor,
  input: { reason?: string; overrideRefundInr?: number },
  req: Pick<Request, 'ip' | 'get'>,
): Promise<{ bookingId: string; reference: string; outcome: CancellationOutcome; refundStatus: 'none' | 'processed' | 'pending' }> {
  const core = await requireBookingCore(kind, id);
  const { cancelledBy, allowed, outcome } = await evaluate(core, actor, input.overrideRefundInr);

  const wasPaid = core.paymentStatus === 'paid';
  const payment = wasPaid
    ? await prisma.payment.findFirst({ where: { bookingType: kind, bookingId: id, status: { in: ['captured', 'partially_refunded'] } }, orderBy: { createdAt: 'desc' } })
    : null;
  if (outcome.refundAmountInr > 0 && !payment?.gatewayPaymentId) {
    throw ApiError.conflict('No captured payment found to refund. Please contact support.', 'NO_PAYMENT_TO_REFUND');
  }

  // What the vendor side keeps of a retained penalty (commission scales with the retained share).
  const share = wasPaid && core.grandTotalInr > 0 ? outcome.penaltyAmountInr / core.grandTotalInr : 0;
  const penaltyCommission = Math.round(core.commissionAmountInr * share);
  const penaltyVendorShare = wasPaid ? outcome.penaltyAmountInr - penaltyCommission : 0;
  const penaltyTaxable = Math.round(core.taxableAmountInr * share);

  const refund = outcome.refundAmountInr;
  const paymentStatus = !wasPaid ? core.paymentStatus : refund >= core.grandTotalInr ? 'refunded' : refund > 0 ? 'partially_refunded' : 'paid';
  const pendingRefundId = refund > 0 ? newPendingRefundId() : null;

  const ops = [
    guardedBookingUpdate(kind, id, allowed, {
      bookingStatus: 'cancelled',
      holdExpiresAt: null,
      paymentStatus,
      cancellation: { cancelledAt: new Date(), cancelledBy, reason: input.reason, refundAmountInr: refund, penaltyAmountInr: outcome.penaltyAmountInr },
      // settlement now reflects only what the vendor keeps (the penalty), so payouts never include cancelled value
      taxableAmountInr: penaltyTaxable,
      commissionAmountInr: penaltyCommission,
      vendorShareInr: penaltyVendorShare,
    }),
    ...(wasPaid ? [vendorWallet.reverse(core.vendorId, core.vendorShareInr, penaltyVendorShare)] : []),
    ...(refund > 0 ? [userMetrics.onRefund(core.userId, refund)] : []),
    ...(payment && pendingRefundId
      ? [
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: refund >= payment.amountInr - payment.refundedAmountInr ? 'refunded' : 'partially_refunded',
              refundedAmountInr: { increment: refund },
              refunds: { push: { refundId: pendingRefundId, amountInr: refund, reason: input.reason, status: 'initiated', createdAt: new Date() } },
            },
          }),
        ]
      : []),
    ...(!wasPaid
      ? [prisma.payment.updateMany({ where: { bookingType: kind, bookingId: id, status: { in: ['initiated', 'failed'] } }, data: { status: 'failed', failureReason: 'BOOKING_CANCELLED' } })]
      : []),
  ];

  if (!(await runGuarded(ops))) throw ApiError.conflict('This booking just changed state. Please refresh and try again.', 'STATE_CHANGED');

  // The DB is now the source of truth; the gateway call follows and is retried by a job if it fails.
  let refundStatus: 'none' | 'processed' | 'pending' = 'none';
  if (payment && pendingRefundId) {
    refundStatus = await dispatchRefund({
      paymentId: payment.id,
      gatewayPaymentId: payment.gatewayPaymentId as string,
      pendingRefundId,
      amountInr: refund,
      reason: input.reason,
    });
  }

  const actorRole = actor.role === 'staff' ? actor.staff.role : actor.role;
  const actorId = actor.role === 'staff' ? actor.staff.id : actor.id;
  if (actor.role !== 'user') {
    await audit({
      actor: { id: actorId, role: actorRole },
      action: 'CANCEL_BOOKING',
      targetEntity: `${kind}Booking`,
      targetId: id,
      previousState: { status: core.status, paymentStatus: core.paymentStatus },
      newState: { reference: core.reference, ...outcome, reason: input.reason, override: input.overrideRefundInr },
      req,
    });
  }
  void notifyCancelled(core, outcome);
  return { bookingId: id, reference: core.reference, outcome, refundStatus };
}

async function notifyCancelled(core: BookingCore, outcome: CancellationOutcome): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: core.userId }, select: { fullName: true, email: true } });
  if (!user) return;
  const mail = templates.bookingCancelled({ name: user.fullName, reference: core.reference, title: core.title, refundInr: outcome.refundAmountInr, penaltyInr: outcome.penaltyAmountInr });
  await sendEmail({ to: user.email, subject: mail.subject, html: mail.html });
}
