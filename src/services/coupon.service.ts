import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import type { BookingKind } from '../modules/bookings/booking.schemas';

export interface CouponDiscountInput {
  discountType: 'percent' | 'flat';
  value: number;
  maxDiscount?: number | null;
}

export interface ResolvedCoupon {
  code: string;
  input: CouponDiscountInput;
}

/**
 * Validates a coupon for user / booking kind / subtotal and returns discount specification.
 */
export async function resolveCoupon(
  code: string | null | undefined,
  userId: string | null | undefined,
  type: BookingKind,
  subtotal: number,
): Promise<ResolvedCoupon | null> {
  if (!code) return null;
  const c = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!c || !c.isActive) throw ApiError.badRequest('Invalid coupon code', undefined, 'COUPON_INVALID');

  const now = new Date();
  if ((c.validFrom && c.validFrom > now) || (c.validTill && c.validTill < now)) {
    throw ApiError.badRequest('This coupon is not valid right now', undefined, 'COUPON_EXPIRED');
  }

  if (c.appliesTo.length && !c.appliesTo.includes(type)) {
    throw ApiError.badRequest(`This coupon is not applicable to ${type} bookings`, undefined, 'COUPON_INAPPLICABLE');
  }

  if (subtotal < c.minAmount) {
    throw ApiError.badRequest(`Minimum booking amount for this coupon is ₹${c.minAmount}`, undefined, 'COUPON_MIN_AMOUNT');
  }

  if (c.usageLimit != null && c.usedCount >= c.usageLimit) {
    throw ApiError.badRequest('This coupon has reached its total usage limit', undefined, 'COUPON_LIMIT_REACHED');
  }

  if (userId && c.perUserLimit) {
    const used = await prisma.couponRedemption.count({ where: { couponId: c.id, userId } });
    if (used >= c.perUserLimit) {
      throw ApiError.badRequest('You have already used this coupon', undefined, 'COUPON_USER_LIMIT');
    }
  }

  return {
    code: c.code,
    input: {
      discountType: c.discountType === 'flat' ? 'flat' : 'percent',
      value: c.value,
      maxDiscount: c.maxDiscount,
    },
  };
}

/**
 * Calculates discount amount in INR based on CouponDiscountInput.
 */
export function calculateCouponDiscount(input: CouponDiscountInput, subtotal: number): number {
  let discount = 0;
  if (input.discountType === 'percent') {
    discount = Math.round((subtotal * input.value) / 100);
  } else {
    discount = Math.round(input.value);
  }
  if (input.maxDiscount != null && input.maxDiscount > 0) {
    discount = Math.min(discount, input.maxDiscount);
  }
  return Math.min(discount, subtotal);
}

/**
 * Idempotently marks a coupon as redeemed by the user on a confirmed booking.
 */
export async function redeemCoupon(code: string | null | undefined, userId: string, bookingId: string): Promise<void> {
  if (!code) return;
  const c = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!c) return;

  await prisma.$transaction([
    prisma.coupon.update({ where: { id: c.id }, data: { usedCount: { increment: 1 } } }),
    prisma.couponRedemption.create({ data: { couponId: c.id, userId, bookingId } }),
  ]);
}
