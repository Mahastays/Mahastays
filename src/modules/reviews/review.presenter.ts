import type { Review } from '@prisma/client';

const monthYear = (d: Date) => d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

/** Public shape matches the spec's IReview (voter ids / moderation internals stay private). */
export function presentReview(r: Review, opts: { viewerId?: string; staff?: boolean } = {}) {
  return {
    id: r.id,
    _id: r.id,
    targetType: r.targetType,
    targetId: r.targetId,
    author: r.author,
    location: r.location,
    avatar: r.avatar,
    date: monthYear(r.createdAt),
    rating: r.rating,
    roomStayed: r.roomStayed,
    tierTravelled: r.tierTravelled,
    slotBooked: r.slotBooked,
    comment: r.comment,
    helpfulCount: r.helpfulCount,
    hasVoted: opts.viewerId ? r.helpfulVotedUserIds.includes(opts.viewerId) : false,
    subScores: r.subScores,
    isVerifiedStay: r.isVerifiedStay,
    vendorReply: r.vendorReply,
    vendorRepliedAt: r.vendorRepliedAt,
    createdAt: r.createdAt,
    ...(opts.staff || opts.viewerId === r.userId
      ? { status: r.status, moderationNote: r.moderationNote, bookingId: r.bookingId, userId: r.userId }
      : {}),
  };
}
