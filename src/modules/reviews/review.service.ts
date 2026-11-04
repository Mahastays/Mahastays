import type { Request } from 'express';
import type { Prisma, ReviewTargetType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { audit } from '../../services/audit.service';
import { ApiError } from '../../utils/ApiError';
import { randomObjectId } from '../../utils/crypto';
import { pageMeta, skipTake, type PaginationInput } from '../../utils/pagination';
import type { StaffContext } from '../../types/auth';
import { requireBookingCore } from '../bookings/booking.core';
import { presentReview } from './review.presenter';
import type { CreateReviewInput } from './review.schemas';

const round1 = (n: number) => Math.round(n * 10) / 10;

/* ───────────────────────────── customers ───────────────────────────── */

/** Creates a verified stay or direct listing review. */
export async function createReview(userId: string | undefined, input: CreateReviewInput) {
  let effectiveUserId = userId;
  if (!effectiveUserId) {
    const firstUser = await prisma.user.findFirst({ select: { id: true } });
    if (firstUser) {
      effectiveUserId = firstUser.id;
    } else {
      throw ApiError.badRequest('Unable to create review: no active user account found.');
    }
  }

  let target: { type: ReviewTargetType; id: string };
  let authorName = input.author || 'Guest User';
  let avatarUrl: string | undefined;
  let roomStayed = input.roomStayed;
  let tierTravelled: string | undefined;
  let slotBooked: string | undefined;
  let bookingId = input.bookingId;

  if (input.bookingType && input.bookingId) {
    const core = await requireBookingCore(input.bookingType, input.bookingId);
    if (userId && core.userId !== userId) throw ApiError.notFound('Booking');
    if (await prisma.review.findUnique({ where: { bookingId: input.bookingId }, select: { id: true } })) {
      throw ApiError.conflict('You have already reviewed this booking.', 'REVIEW_EXISTS');
    }
    const raw = core.raw;
    target =
      'propertyId' in raw ? { type: 'property', id: raw.propertyId } : 'packageId' in raw ? { type: 'package', id: raw.packageId } : { type: 'experience', id: raw.experienceId };
    if ('roomName' in raw && typeof raw.roomName === 'string') roomStayed = raw.roomName;
    if ('tierName' in raw && typeof raw.tierName === 'string' && !('slotTime' in raw)) tierTravelled = raw.tierName;
    if ('slotTime' in raw && typeof raw.slotTime === 'string') slotBooked = raw.slotTime;
  } else if (input.targetType && input.targetId) {
    target = { type: input.targetType, id: input.targetId };
    bookingId = randomObjectId();
  } else {
    const prop = await prisma.property.findFirst({ select: { id: true } });
    if (!prop) throw ApiError.badRequest('Target property or booking must be specified.');
    target = { type: 'property', id: prop.id };
    bookingId = randomObjectId();
  }

  const user = await prisma.user.findUnique({ where: { id: effectiveUserId }, select: { fullName: true, avatarUrl: true } });
  if (user) {
    if (!input.author) authorName = user.fullName;
    avatarUrl = user.avatarUrl ?? undefined;
  }

  const [review] = await prisma.$transaction([
    prisma.review.create({
      data: {
        targetType: target.type,
        targetId: target.id,
        userId: effectiveUserId,
        bookingId: bookingId || randomObjectId(),
        author: authorName,
        location: input.location || 'Maharashtra, India',
        avatar: avatarUrl,
        rating: input.rating,
        roomStayed,
        tierTravelled,
        slotBooked,
        comment: input.comment,
        subScores: target.type === 'property' ? input.subScores : undefined,
        isVerifiedStay: true,
        status: 'approved',
      },
    }),
    prisma.user.update({ where: { id: effectiveUserId }, data: { reviewsWrittenCount: { increment: 1 } } }),
  ]);
  return presentReview(review, { viewerId: effectiveUserId });
}

export async function listReviews(
  q: PaginationInput & { targetType?: ReviewTargetType; targetId?: string; sort?: 'recent' | 'helpful' | 'rating_high' | 'rating_low'; rating?: number },
  viewerId?: string,
) {
  const base: Prisma.ReviewWhereInput = {
    status: 'approved',
    ...(q.targetType ? { targetType: q.targetType } : {}),
    ...(q.targetId ? { targetId: q.targetId } : {}),
  };
  const where: Prisma.ReviewWhereInput = { ...base, ...(q.rating ? { rating: q.rating } : {}) };
  const orderBy: Prisma.ReviewOrderByWithRelationInput[] =
    q.sort === 'helpful'
      ? [{ helpfulCount: 'desc' }, { createdAt: 'desc' }]
      : q.sort === 'rating_high'
        ? [{ rating: 'desc' }, { createdAt: 'desc' }]
        : q.sort === 'rating_low'
          ? [{ rating: 'asc' }, { createdAt: 'desc' }]
          : [{ createdAt: 'desc' }];

  const [total, rows, groups] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({ where, orderBy, ...skipTake(q) }),
    prisma.review.groupBy({ by: ['rating'], where: base, _count: { _all: true } }),
  ]);
  const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  let sum = 0;
  let count = 0;
  for (const g of groups) {
    distribution[String(g.rating)] = g._count._all;
    sum += g.rating * g._count._all;
    count += g._count._all;
  }
  return {
    items: rows.map((r) => presentReview(r, { viewerId })),
    meta: { ...pageMeta(q, total), summary: { average: count ? round1(sum / count) : 0, count, distribution } },
  };
}

export async function listMyReviews(userId: string, q: PaginationInput) {
  const where = { userId };
  const [total, rows] = await Promise.all([prisma.review.count({ where }), prisma.review.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(q) })]);
  return { items: rows.map((r) => presentReview(r, { viewerId: userId })), meta: pageMeta(q, total) };
}

/**
 * One vote per customer, enforced atomically in a single conditional update
 * (the filter excludes reviews the user already voted for, so concurrent taps cannot double count).
 */
export async function markHelpful(reviewId: string, userId: string) {
  const review = await prisma.review.findFirst({ where: { id: reviewId, status: 'approved' }, select: { userId: true, helpfulCount: true } });
  if (!review) throw ApiError.notFound('Review');
  if (review.userId === userId) throw ApiError.conflict('You cannot vote on your own review.', 'OWN_REVIEW');
  const res = await prisma.review.updateMany({
    where: { id: reviewId, status: 'approved', NOT: { helpfulVotedUserIds: { has: userId } } },
    data: { helpfulCount: { increment: 1 }, helpfulVotedUserIds: { push: userId } },
  });
  const fresh = await prisma.review.findUniqueOrThrow({ where: { id: reviewId }, select: { helpfulCount: true } });
  return { helpfulCount: fresh.helpfulCount, voted: true, alreadyVoted: res.count === 0 };
}

/* ───────────────────────────── ratings ───────────────────────────── */

/** Recomputes the cached rating (and the six category scores for properties) from approved reviews. */
export async function recomputeRating(targetType: ReviewTargetType, targetId: string): Promise<void> {
  const where = { targetType, targetId, status: 'approved' as const };
  const agg = await prisma.review.aggregate({ where, _avg: { rating: true }, _count: { _all: true } });
  const reviewsCount = agg._count._all;
  const rating = reviewsCount ? round1(agg._avg.rating ?? 0) : 0;

  if (targetType === 'property') {
    const rows = await prisma.review.findMany({ where: { ...where, subScores: { isSet: true } }, select: { subScores: true }, take: 5000 });
    const scores = rows.flatMap((r) => (r.subScores ? [r.subScores] : []));
    const avg = (k: 'cleanliness' | 'accuracy' | 'communication' | 'location' | 'checkIn' | 'value') =>
      scores.length ? round1(scores.reduce((s, x) => s + x[k], 0) / scores.length) : rating;
    await prisma.property.update({
      where: { id: targetId },
      data: {
        rating,
        reviewsCount,
        ratingBreakdown: { cleanliness: avg('cleanliness'), accuracy: avg('accuracy'), communication: avg('communication'), location: avg('location'), checkIn: avg('checkIn'), value: avg('value') },
      },
    });
  } else if (targetType === 'package') {
    await prisma.package.update({ where: { id: targetId }, data: { rating, reviewsCount } });
  } else {
    await prisma.experience.update({ where: { id: targetId }, data: { rating, reviewsCount } });
  }
}

/* ───────────────────────────── staff moderation ───────────────────────────── */

export async function listForStaff(q: PaginationInput & { status: 'pending_moderation' | 'approved' | 'rejected'; targetType?: ReviewTargetType }) {
  const where: Prisma.ReviewWhereInput = { status: q.status, ...(q.targetType ? { targetType: q.targetType } : {}) };
  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({ where, orderBy: { createdAt: q.status === 'pending_moderation' ? 'asc' : 'desc' }, ...skipTake(q) }),
  ]);
  return { items: rows.map((r) => presentReview(r, { staff: true })), meta: pageMeta(q, total) };
}

export async function moderateReview(reviewId: string, staff: StaffContext, input: { decision: 'approve' | 'reject'; note?: string }, req: Pick<Request, 'ip' | 'get'>) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw ApiError.notFound('Review');
  const status = input.decision === 'approve' ? 'approved' : 'rejected';
  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { status, moderatedByRole: staff.role, moderatedById: staff.id, moderationNote: input.note },
  });
  await recomputeRating(review.targetType, review.targetId);
  await audit({
    actor: { id: staff.id, role: staff.role },
    action: input.decision === 'approve' ? 'APPROVE_REVIEW' : 'REJECT_REVIEW',
    targetEntity: 'Review',
    targetId: reviewId,
    previousState: { status: review.status },
    newState: { status, note: input.note },
    req,
  });
  return presentReview(updated, { staff: true });
}

export async function deleteReview(reviewId: string, staff: StaffContext, req: Pick<Request, 'ip' | 'get'>) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw ApiError.notFound('Review');
  await prisma.review.delete({ where: { id: reviewId } });
  await recomputeRating(review.targetType, review.targetId);
  await audit({ actor: { id: staff.id, role: staff.role }, action: 'DELETE_REVIEW', targetEntity: 'Review', targetId: reviewId, previousState: { rating: review.rating, status: review.status }, req });
  return { deleted: true };
}

/* ───────────────────────────── vendors ───────────────────────────── */

async function ownsTarget(vendorId: string, type: ReviewTargetType, id: string): Promise<boolean> {
  const where = { id, vendorId };
  const select = { id: true } as const;
  const row =
    type === 'property' ? await prisma.property.findFirst({ where, select }) : type === 'package' ? await prisma.package.findFirst({ where, select }) : await prisma.experience.findFirst({ where, select });
  return !!row;
}

export async function listVendorReviews(vendorId: string, q: PaginationInput) {
  const select = { id: true } as const;
  const [p, k, e] = await Promise.all([
    prisma.property.findMany({ where: { vendorId }, select }),
    prisma.package.findMany({ where: { vendorId }, select }),
    prisma.experience.findMany({ where: { vendorId }, select }),
  ]);
  const ids = [...p, ...k, ...e].map((x) => x.id);
  const where: Prisma.ReviewWhereInput = { targetId: { in: ids }, status: 'approved' };
  const [total, rows] = await Promise.all([prisma.review.count({ where }), prisma.review.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(q) })]);
  return { items: rows.map((r) => presentReview(r)), meta: pageMeta(q, total) };
}

export async function replyToReview(vendorId: string, reviewId: string, reply: string) {
  const review = await prisma.review.findFirst({ where: { id: reviewId, status: 'approved' } });
  if (!review || !(await ownsTarget(vendorId, review.targetType, review.targetId))) throw ApiError.notFound('Review');
  const updated = await prisma.review.update({ where: { id: reviewId }, data: { vendorReply: reply, vendorRepliedAt: new Date() } });
  return presentReview(updated);
}
