import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';
import * as v from '../../utils/zod';
import { bookingKindParam } from '../bookings/booking.schemas';

export const REVIEW_TARGETS = ['property', 'package', 'experience'] as const;

const score = z.number().int().min(1).max(5);

export const createReviewSchema = z.object({
  bookingType: bookingKindParam.optional(),
  bookingId: v.objectId.optional(),
  targetType: z.enum(REVIEW_TARGETS).optional(),
  targetId: v.objectId.optional(),
  author: v.optionalTrimmed(100),
  location: v.optionalTrimmed(80),
  rating: score,
  comment: v.trimmed(5, 2000),
  roomStayed: v.optionalTrimmed(100),
  /** Category scores — only used for property (stay) reviews. */
  subScores: z.object({ cleanliness: score, accuracy: score, communication: score, location: score, checkIn: score, value: score }).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const listReviewsQuery = paginationSchema.extend({
  targetType: z.enum(REVIEW_TARGETS).optional(),
  targetId: v.objectId.optional(),
  sort: z.enum(['recent', 'helpful', 'rating_high', 'rating_low']).default('recent'),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export const staffReviewQuery = paginationSchema.extend({
  status: z.enum(['pending_moderation', 'approved', 'rejected']).default('pending_moderation'),
  targetType: z.enum(REVIEW_TARGETS).optional(),
});

export const moderateSchema = z
  .object({ decision: z.enum(['approve', 'reject']), note: v.optionalTrimmed(300) })
  .refine((b) => b.decision !== 'reject' || !!b.note, { message: 'A note is required when rejecting a review', path: ['note'] });

export const replySchema = z.object({ reply: v.trimmed(2, 1000) });
