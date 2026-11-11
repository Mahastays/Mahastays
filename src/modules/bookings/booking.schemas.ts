import { z } from 'zod';
import { MAX_PARTICIPANTS_PER_BOOKING, MAX_ROOMS_PER_BOOKING } from '../../config/constants';
import { paginationSchema } from '../../utils/pagination';
import * as v from '../../utils/zod';

export const BOOKING_KINDS = ['stay', 'package', 'experience'] as const;
export type BookingKind = (typeof BOOKING_KINDS)[number];
export const bookingKindParam = z.enum(BOOKING_KINDS);

const party = (max: number) =>
  z.object({
    adults: z.number().int().min(1, 'At least one adult is required').max(max),
    children: z.number().int().min(0).max(max).default(0),
  });

export const stayBookingSchema = z
  .object({
    propertyId: v.objectId,
    roomId: z.string().trim().min(2).max(40),
    checkInDate: v.isoDate,
    checkOutDate: v.isoDate,
    guests: party(60),
    quantity: z.number().int().min(1).max(MAX_ROOMS_PER_BOOKING).default(1),
    specialRequests: v.optionalTrimmed(500),
    /** Customer's state (for the CGST+SGST vs IGST split on the invoice). */
    billingState: v.optionalTrimmed(80),
  })
  .refine((b) => b.checkOutDate > b.checkInDate, { message: 'checkOutDate must be after checkInDate', path: ['checkOutDate'] });
export type StayBookingInput = z.infer<typeof stayBookingSchema>;

export const packageBookingSchema = z.object({
  packageId: v.objectId,
  tierId: z.string().trim().min(2).max(60),
  startDate: v.isoDate,
  travelers: party(MAX_PARTICIPANTS_PER_BOOKING),
  specialRequests: v.optionalTrimmed(500),
  billingState: v.optionalTrimmed(80),
});
export type PackageBookingInput = z.infer<typeof packageBookingSchema>;

export const experienceBookingSchema = z.object({
  experienceId: v.objectId,
  tierId: z.string().trim().min(2).max(60),
  slotId: z.string().trim().min(2).max(60),
  activityDate: v.isoDate,
  participants: party(MAX_PARTICIPANTS_PER_BOOKING),
  customerLocation: v.optionalTrimmed(300),
  specialRequests: v.optionalTrimmed(500),
  billingState: v.optionalTrimmed(80),
});
export type ExperienceBookingInput = z.infer<typeof experienceBookingSchema>;

export const cancelSchema = z.object({ reason: v.optionalTrimmed(300) });
export const staffCancelSchema = cancelSchema.extend({ overrideRefundInr: z.number().int().min(0).optional() });

const ANY_STATUS = ['pending', 'confirmed', 'reserved', 'checked_in', 'checked_out', 'completed', 'cancelled', 'no_show'] as const;

export const historyQuery = paginationSchema.extend({
  type: bookingKindParam.optional(),
  status: z.enum(ANY_STATUS).optional(),
});

export const staffBookingQuery = historyQuery.extend({
  q: z.string().trim().max(60).optional(), // booking reference
  vendorId: v.objectId.optional(),
  userId: v.objectId.optional(),
  from: v.isoDate.optional(),
  to: v.isoDate.optional(),
});

export const vendorBookingQuery = historyQuery.extend({
  q: z.string().trim().max(60).optional(),
  from: v.isoDate.optional(),
  to: v.isoDate.optional(),
});

export const stayActionSchema = z.object({ action: z.enum(['check_in', 'check_out', 'no_show']) });
export const packageActionSchema = z.object({ action: z.enum(['complete']) });
export const experienceActionSchema = z.object({ action: z.enum(['check_in', 'complete', 'no_show']) });
export const redeemVoucherSchema = z.object({ voucherCode: z.string().trim().min(6).max(40).toUpperCase() });
