import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';
import * as v from '../../utils/zod';

export const requestPayoutSchema = z.object({
  /** Only bookings whose service ended on/before this date (default: today minus the hold period). */
  upTo: v.isoDate.optional(),
});

export const payoutListQuery = paginationSchema.extend({
  status: z.enum(['requested', 'audited_by_admin', 'released_by_superadmin', 'completed', 'failed']).optional(),
  vendorId: v.objectId.optional(),
});

export const auditPayoutSchema = z.object({ notes: v.optionalTrimmed(500) });

export const releasePayoutSchema = z.object({
  payoutId: v.objectId,
  transferMethod: z.enum(['NEFT', 'RTGS', 'IMPS']),
  /** Provide the bank reference when the transfer is already done → payout is completed in the same step. */
  utrNumber: z.string().trim().min(6).max(40).optional(),
});

export const completePayoutSchema = z.object({ utrNumber: z.string().trim().min(6).max(40) });
export const failPayoutSchema = z.object({ reason: v.trimmed(3, 300) });
