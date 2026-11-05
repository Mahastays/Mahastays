import type { Payment, Vendor } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { getPaymentGateway, type GatewayOrder, type PaymentGateway } from '../../services/payment/gateway';
import { ApiError } from '../../utils/ApiError';
import { minutesFromNow } from '../../utils/dates';
import type { BookingKind } from './booking.schemas';

const MAX_UNPAID_HOLDS_PER_USER = 5;

export async function isActiveClubMember(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { membership: true, status: true } });
  if (!u || u.status !== 'active') return false;
  return u.membership.isClubMember && (!u.membership.expiresAt || u.membership.expiresAt.getTime() > Date.now());
}

/** Returns the customer or throws. Also stops a single account from hoarding inventory with unpaid holds. */
export async function assertUserCanBook(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== 'active') throw ApiError.forbidden('Your account cannot make bookings', 'ACCOUNT_INACTIVE');
  if (!user.phone?.nationalNumber || user.phone.nationalNumber.replace(/\D/g, '').length < 10) {
    throw ApiError.badRequest('A valid 10-digit mobile phone number is mandatory to book.', 'PHONE_REQUIRED');
  }
  const now = new Date();
  const where = { userId, bookingStatus: 'pending' as const, holdExpiresAt: { gt: now } };
  const counts = await Promise.all([
    prisma.stayBooking.count({ where }),
    prisma.packageBooking.count({ where }),
    prisma.experienceBooking.count({ where }),
  ]);
  if (counts.reduce((a, b) => a + b, 0) >= MAX_UNPAID_HOLDS_PER_USER) {
    throw ApiError.tooMany('You have several unpaid reservations. Please complete or cancel them first.');
  }
  return user;
}

/** Vendor must be active + KYC-approved for their listings to be bookable. */
export async function loadBookableVendor(vendorId: string): Promise<Vendor> {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.status !== 'active' || vendor.compliance.verificationStatus !== 'approved') {
    throw ApiError.conflict('This listing is currently not accepting bookings', 'VENDOR_UNAVAILABLE');
  }
  if ((vendor as any).acceptingBookings === false) {
    throw ApiError.conflict('This vendor is currently not accepting bookings', 'VENDOR_BOOKINGS_PAUSED');
  }
  return vendor;
}

export const newHoldExpiry = (): Date => minutesFromNow(env.BOOKING_HOLD_MINUTES);

export interface CheckoutPayload {
  paymentId: string;
  gateway: PaymentGateway['name'];
  keyId: string;
  orderId: string;
  amountInr: number;
  amountPaise: number;
  currency: 'INR';
  bookingType: BookingKind;
  bookingReference: string;
  holdExpiresAt: Date | null;
  prefill: { name: string; email: string; contact?: string };
  mock?: { captureEndpoint: string; note: string };
}

export function checkoutPayload(
  gateway: PaymentGateway,
  payment: Pick<Payment, 'id' | 'gatewayOrderId' | 'amountInr'>,
  ctx: {
    bookingType: BookingKind;
    reference: string;
    holdExpiresAt: Date | null;
    customer: { fullName: string; email: string; phone?: { countryCode: string; nationalNumber: string } | null };
  },
): CheckoutPayload {
  return {
    paymentId: payment.id,
    gateway: gateway.name,
    keyId: gateway.publicKey,
    orderId: payment.gatewayOrderId,
    amountInr: payment.amountInr,
    amountPaise: Math.round(payment.amountInr * 100),
    currency: 'INR',
    bookingType: ctx.bookingType,
    bookingReference: ctx.reference,
    holdExpiresAt: ctx.holdExpiresAt,
    prefill: {
      name: ctx.customer.fullName,
      email: ctx.customer.email,
      contact: ctx.customer.phone ? `${ctx.customer.phone.countryCode}${ctx.customer.phone.nationalNumber}` : undefined,
    },
    ...(gateway.name === 'mock' && !env.isProd
      ? { mock: { captureEndpoint: '/api/v1/payments/mock/capture', note: 'Dev gateway: POST { orderId } to simulate a successful payment.' } }
      : {}),
  };
}

/** Creates the gateway order + our Payment record for a freshly created pending booking. */
export async function createCheckoutOrder(input: {
  bookingType: BookingKind;
  bookingId: string;
  reference: string;
  userId: string;
  vendorId: string;
  amountInr: number;
  holdExpiresAt: Date;
  customer: { fullName: string; email: string; phone?: { countryCode: string; nationalNumber: string } | null };
}): Promise<CheckoutPayload> {
  const gateway = getPaymentGateway();
  const order: GatewayOrder = await gateway.createOrder({
    amountInr: input.amountInr,
    receipt: input.reference,
    notes: { bookingType: input.bookingType, bookingId: input.bookingId, reference: input.reference },
  });
  const payment = await prisma.payment.create({
    data: {
      bookingType: input.bookingType,
      bookingId: input.bookingId,
      userId: input.userId,
      vendorId: input.vendorId,
      gateway: gateway.name,
      gatewayOrderId: order.orderId,
      amountInr: input.amountInr,
      status: 'initiated',
    },
  });
  return checkoutPayload(gateway, payment, {
    bookingType: input.bookingType,
    reference: input.reference,
    holdExpiresAt: input.holdExpiresAt,
    customer: input.customer,
  });
}

/** Re-uses the open payment order of an identical, still-valid reservation (safe client retries). */
export async function reuseCheckout(
  bookingType: BookingKind,
  bookingId: string,
  reference: string,
  holdExpiresAt: Date | null,
  customer: { fullName: string; email: string; phone?: { countryCode: string; nationalNumber: string } | null },
): Promise<CheckoutPayload | null> {
  const payment = await prisma.payment.findFirst({ where: { bookingType, bookingId, status: 'initiated' }, orderBy: { createdAt: 'desc' } });
  if (!payment) return null;
  return checkoutPayload(getPaymentGateway(), payment, { bookingType, reference, holdExpiresAt, customer });
}

export const cancellationBySystem = (reason: string) => ({
  cancelledAt: new Date(),
  cancelledBy: 'system' as const,
  reason,
  refundAmountInr: 0,
  penaltyAmountInr: 0,
});
