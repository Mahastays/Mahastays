import type { Payment } from '@prisma/client';
import { env } from '../../config/env';
import { SAC_CODES } from '../../config/constants';
import { logger } from '../../config/logger';
import { prisma } from '../../lib/prisma';
import { runGuarded } from '../../lib/tx';
import { audit } from '../../services/audit.service';
import { lockService } from '../../services/lock.service';
import { sendEmail, sendTransactionalSms } from '../../services/notification.service';
import { templates } from '../../services/notification.templates';
import { getPaymentGateway, type PaymentGateway } from '../../services/payment/gateway';
import { MockGateway } from '../../services/payment/mock.gateway';
import { ApiError } from '../../utils/ApiError';
import { generateInvoiceNumber, generateVoucherCode } from '../../utils/codes';
import { randomToken } from '../../utils/crypto';
import { toPaise } from '../../utils/money';
import { STATUS, guardedBookingUpdate, loadBookingCore, userMetrics, vendorWallet, type BookingCore } from '../bookings/booking.core';
import { getUserBooking } from '../bookings/booking.query.service';
import type { BookingKind } from '../bookings/booking.schemas';
import { splitGst } from '../bookings/pricing.engine';

const CAPTURABLE: Payment['status'][] = ['initiated', 'authorized', 'failed'];

export type CaptureOutcome = 'confirmed' | 'already_processed' | 'unknown_order' | 'refunded_late' | 'amount_mismatch' | 'not_captured';

export interface CaptureResult {
  outcome: CaptureOutcome;
  bookingType?: BookingKind;
  bookingId?: string;
  reference?: string;
}

const whenLabel = (core: BookingCore): string => {
  const raw = core.raw;
  if ('checkInDate' in raw) return `${raw.checkInDate} → ${raw.checkOutDate} (${raw.nights} night${raw.nights > 1 ? 's' : ''})`;
  if ('startDate' in raw) return `${raw.startDate} → ${raw.endDate}`;
  return `${raw.activityDate} · ${raw.slotTime}`;
};

/**
 * The single place where "money received" turns into "booking confirmed".
 * Called by the client-side verify endpoint, the gateway webhook and the dev mock — in any order, any number of times.
 * Idempotency comes from the guarded batch transaction (lib/tx.ts), not from in-memory flags.
 */
export async function confirmCapture(input: {
  orderId: string;
  paymentId: string;
  method?: string;
  signature?: string;
  source: 'client' | 'webhook' | 'mock';
}): Promise<CaptureResult> {
  const payment = await prisma.payment.findUnique({ where: { gatewayOrderId: input.orderId } });
  if (!payment) {
    logger.warn({ orderId: input.orderId, source: input.source }, 'capture for unknown gateway order');
    return { outcome: 'unknown_order' };
  }
  const kind = payment.bookingType as BookingKind;
  const base = { bookingType: kind, bookingId: payment.bookingId };

  if (!CAPTURABLE.includes(payment.status)) {
    await ensureInvoice(payment.id); // self-heal: captured but invoice number missing (crash between steps)
    return { outcome: 'already_processed', ...base };
  }

  const core = await loadBookingCore(kind, payment.bookingId);
  if (!core) {
    logger.error({ paymentId: payment.id }, 'payment points to a missing booking');
    return { outcome: 'unknown_order' };
  }
  const gateway = getPaymentGateway();

  // Booking already expired / cancelled while the customer was paying → money must go back.
  if (core.status === 'cancelled') {
    await refundLateCapture(payment, input.paymentId, gateway);
    return { outcome: 'refunded_late', ...base, reference: core.reference };
  }

  let method = input.method;
  if (gateway.name === 'razorpay') {
    const info = await gateway.fetchPayment(input.paymentId);
    if (info) {
      if (info.orderId !== input.orderId || info.amountPaise !== toPaise(payment.amountInr)) {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed', failureReason: 'AMOUNT_OR_ORDER_MISMATCH' } });
        logger.error({ paymentId: payment.id, info }, 'gateway payment does not match our order');
        return { outcome: 'amount_mismatch', ...base, reference: core.reference };
      }
      if (info.status !== 'captured') return { outcome: 'not_captured', ...base, reference: core.reference };
      method = info.method ?? method;
    }
  }

  // GST breakup for the invoice (CGST+SGST for intra-state, IGST for inter-state supplies)
  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id: core.vendorId }, select: { compliance: true, contact: true, businessName: true } });
  const taxesGst = core.raw.pricing.taxesGst;
  const gst = splitGst(taxesGst, vendor.contact.registeredOfficeAddress.state, core.billingState);

  const ops = [
    prisma.payment.update({
      where: { id: payment.id, status: { in: CAPTURABLE } },
      data: {
        status: 'captured',
        gatewayPaymentId: input.paymentId,
        gatewaySignature: input.signature,
        method,
        capturedAt: new Date(),
        failureReason: null,
        gstDetails: {
          gstinVendor: vendor.compliance.gstin ?? undefined,
          sacCode: SAC_CODES[kind],
          cgstAmountInr: gst.cgst,
          sgstAmountInr: gst.sgst,
          igstAmountInr: gst.igst,
        },
      },
    }),
    guardedBookingUpdate(kind, core.id, ['pending'], {
      paymentStatus: 'paid',
      bookingStatus: STATUS[kind].paid,
      holdExpiresAt: null,
      confirmedAt: new Date(),
      ...(kind === 'package' ? { freeActivityPasses: await buildFreeActivityPasses(core) } : {}),
    }),
    vendorWallet.creditPending(core.vendorId, core.vendorShareInr),
    userMetrics.onConfirmed(core.userId, core.grandTotalInr, core.memberDiscountInr),
    ...(kind === 'package' ? [prisma.package.update({ where: { id: (core.raw as { packageId: string }).packageId }, data: { totalBookings: { increment: 1 } } })] : []),
  ];

  const applied = await runGuarded(ops);
  if (!applied) {
    // lost a race: either another confirmation won (fine) or the hold expired a millisecond ago (refund)
    const fresh = await prisma.payment.findUnique({ where: { id: payment.id } });
    if (fresh && !CAPTURABLE.includes(fresh.status)) return { outcome: 'already_processed', ...base, reference: core.reference };
    await refundLateCapture(payment, input.paymentId, gateway);
    return { outcome: 'refunded_late', ...base, reference: core.reference };
  }

  await ensureInvoice(payment.id);
  void notifyConfirmed(core);
  void audit({ actor: { role: 'system' }, action: 'PAYMENT_CAPTURED', targetEntity: 'Payment', targetId: payment.id, newState: { source: input.source, bookingReference: core.reference, amountInr: payment.amountInr } });
  return { outcome: 'confirmed', ...base, reference: core.reference };
}

/** One voucher per bundled activity, issued only once the package is paid. */
async function buildFreeActivityPasses(core: BookingCore) {
  const pkg = await prisma.package.findUnique({ where: { id: (core.raw as { packageId: string }).packageId }, select: { freeActivities: true } });
  return (pkg?.freeActivities ?? [])
    .filter((a) => a.experienceId)
    .map((a) => ({ activityId: a.experienceId, activityName: a.name, passVoucherCode: generateVoucherCode(), isRedeemed: false }));
}

/** Assigns the sequential invoice number exactly once (serialised per payment → no duplicates, no gaps from races). */
export async function ensureInvoice(paymentId: string): Promise<void> {
  await lockService.withLock(`invoice:${paymentId}`, async () => {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status === 'initiated' || payment.invoiceNumber) return;
    const invoiceNumber = await generateInvoiceNumber();
    await prisma.payment.update({
      where: { id: paymentId },
      data: { invoiceNumber, pdfInvoiceUrl: `${env.API_PUBLIC_URL}/api/v1/payments/${paymentId}/invoice` },
    });
    await guardedBookingUpdate(payment.bookingType as BookingKind, payment.bookingId, null, { invoiceNumber });
  });
}

async function refundLateCapture(payment: Payment, gatewayPaymentId: string, gateway: PaymentGateway): Promise<void> {
  try {
    const refund = await gateway.refund({ paymentId: gatewayPaymentId, amountInr: payment.amountInr, reason: 'Booking hold expired before payment completed', idempotencyKey: payment.id });
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'refunded',
        gatewayPaymentId,
        capturedAt: new Date(),
        refundedAmountInr: payment.amountInr,
        failureReason: 'LATE_CAPTURE_REFUNDED',
        refunds: { push: { refundId: refund.refundId, amountInr: payment.amountInr, reason: 'Late capture after hold expiry', status: refund.status, createdAt: new Date() } },
      },
    });
    logger.warn({ paymentId: payment.id }, 'late capture refunded automatically');
  } catch (err) {
    // Money is with us but the refund call failed: flag for the finance team instead of losing track.
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'captured', gatewayPaymentId, capturedAt: new Date(), failureReason: 'LATE_CAPTURE_REFUND_PENDING' } });
    logger.error({ err, paymentId: payment.id }, 'LATE CAPTURE REFUND FAILED — manual refund required');
  }
}

async function notifyConfirmed(core: BookingCore): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: core.userId }, select: { fullName: true, email: true, phone: true } });
    if (!user) return;
    const raw = core.raw as any;
    const guests = raw?.guestsCount
      ? `${raw.guestsCount} Guests`
      : raw?.guests?.adults
      ? `${raw.guests.adults} Adults${raw.guests.children ? `, ${raw.guests.children} Child` : ''}`
      : raw?.adults
      ? `${raw.adults} Adults${raw.children ? `, ${raw.children} Child` : ''}`
      : undefined;
    const invoiceNumber = raw?.invoiceNumber || (core.reference ? core.reference.replace('MHA-', 'INV-') : undefined);
    const mail = templates.bookingConfirmed({
      name: user.fullName,
      reference: core.reference,
      title: core.title,
      when: whenLabel(core),
      totalInr: core.grandTotalInr,
      guests,
      invoiceNumber,
      phone: raw?.guestPhone || user.phone?.nationalNumber,
    });
    await sendEmail({ to: user.email, subject: mail.subject, html: mail.html });
    if (user.phone) await sendTransactionalSms(`${user.phone.countryCode}${user.phone.nationalNumber}`, `Mahastays: booking ${core.reference} confirmed. Total paid Rs ${core.grandTotalInr}.`);
  } catch (err) {
    logger.error({ err }, 'failed to send booking confirmation');
  }
}

/* ───────────────────────── entry points ───────────────────────── */

/** POST /payments/verify — called by the frontend right after checkout succeeds. */
export async function verifyClientPayment(userId: string, input: { orderId: string; paymentId: string; signature: string }) {
  const payment = await prisma.payment.findUnique({ where: { gatewayOrderId: input.orderId } });
  if (!payment || payment.userId !== userId) throw ApiError.notFound('Payment');
  if (!getPaymentGateway().verifyPaymentSignature(input)) throw ApiError.badRequest('Payment signature could not be verified', undefined, 'INVALID_SIGNATURE');

  const result = await confirmCapture({ ...input, source: 'client' });
  if (result.outcome === 'refunded_late') {
    throw ApiError.conflict('Your reservation expired before the payment completed. The amount is being refunded automatically.', 'HOLD_EXPIRED_REFUNDED');
  }
  if (result.outcome === 'not_captured') {
    throw ApiError.conflict('The payment is not captured yet. We will confirm your booking as soon as it is.', 'PAYMENT_PENDING');
  }
  if (result.outcome === 'amount_mismatch' || result.outcome === 'unknown_order' || !result.bookingType || !result.bookingId) {
    throw ApiError.badRequest('Payment could not be matched to a booking. Please contact support.', undefined, 'PAYMENT_MISMATCH');
  }
  return { status: result.outcome, booking: await getUserBooking(result.bookingType, result.bookingId, userId) };
}

/** POST /payments/verify-webhook — gateway → server. Always answers 200 for authentic events so the gateway stops retrying. */
export async function handleWebhook(rawBody: Buffer, signature: string | undefined) {
  const gateway = getPaymentGateway();
  if (!signature || !gateway.verifyWebhookSignature(rawBody, signature)) {
    throw ApiError.unauthorized('Invalid webhook signature. Verify the Secret configured in Razorpay Dashboard matches RAZORPAY_WEBHOOK_SECRET.', 'INVALID_SIGNATURE');
  }
  let event: { event?: string; payload?: Record<string, { entity?: Record<string, unknown> }> };
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw ApiError.badRequest('Malformed webhook body', undefined, 'INVALID_JSON');
  }

  logger.info({ event: event.event }, '[webhook] Processing Razorpay webhook event');

  const paymentEntity = event.payload?.payment?.entity as { id?: string; order_id?: string; method?: string; error_description?: string } | undefined;
  const orderEntity = event.payload?.order?.entity as { id?: string } | undefined;

  switch (event.event) {
    case 'payment.captured':
    case 'order.paid':
    case 'payment.authorized': {
      const orderId = paymentEntity?.order_id ?? orderEntity?.id;
      if (paymentEntity?.id && orderId) {
        logger.info({ orderId, paymentId: paymentEntity.id, event: event.event }, '[webhook] Confirming capture from Razorpay webhook');
        await confirmCapture({ orderId, paymentId: paymentEntity.id, method: paymentEntity.method, source: 'webhook' });
      }
      break;
    }
    case 'payment.failed': {
      if (paymentEntity?.order_id) {
        logger.warn({ orderId: paymentEntity.order_id, reason: paymentEntity.error_description }, '[webhook] Razorpay payment failed event received');
        await prisma.payment.updateMany({
          where: { gatewayOrderId: paymentEntity.order_id, status: 'initiated' },
          data: { status: 'failed', failureReason: paymentEntity.error_description?.slice(0, 250) ?? 'PAYMENT_FAILED' },
        });
      }
      break;
    }
    default:
      logger.info({ event: event.event }, '[webhook] Razorpay webhook event received and acknowledged');
  }
  return { received: true, event: event.event };
}

/** DEV ONLY (mock gateway): simulates the customer completing checkout. */
export async function mockCapture(userId: string, orderId: string) {
  const gateway = getPaymentGateway();
  if (env.isProd || !(gateway instanceof MockGateway)) throw ApiError.notFound('Route');
  const payment = await prisma.payment.findUnique({ where: { gatewayOrderId: orderId } });
  if (!payment || payment.userId !== userId) throw ApiError.notFound('Payment');
  const paymentId = `pay_mock_${randomToken(6)}`;
  const signature = gateway.signPayment(orderId, paymentId);
  const result = await confirmCapture({ orderId, paymentId, signature, method: 'upi', source: 'mock' });
  const booking = result.bookingType && result.bookingId ? await getUserBooking(result.bookingType, result.bookingId, userId) : null;
  return { outcome: result.outcome, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature, booking };
}
