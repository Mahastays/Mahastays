import type { Experience } from '@prisma/client';
import { formatInr } from '../../utils/money';
import { omit } from '../../utils/object';

export function presentExperience(e: Experience) {
  return {
    ...omit(e, 'slots', 'tiers', 'guide'),
    _id: e.id,
    name: e.title,
    rating: `${e.rating.toFixed(1)}/5 ★`,
    ratingScore: e.rating,
    price: `${formatInr(e.numericPrice)} / person`,
    slots: e.slots.map((s) => ({ ...s, id: s.slotId, availableSpots: s.capacity, price: s.price ?? e.numericPrice })),
    tiers: e.tiers.map((t) => ({ ...t, id: t.tierId })),
    guide: e.guide,
    guideName: e.guide?.name ?? null,
    guideRole: e.guide?.role ?? null,
  };
}

export function presentExperienceCard(e: Experience, extra: Record<string, unknown> = {}) {
  return {
    id: e.id,
    _id: e.id,
    slug: e.slug,
    title: e.title,
    name: e.title,
    country: e.country,
    flag: e.flag,
    city: e.city,
    locationId: e.locationId,
    duration: e.duration,
    category: e.category,
    rating: `${e.rating.toFixed(1)}/5 ★`,
    ratingScore: e.rating,
    reviewsCount: e.reviewsCount,
    price: `${formatInr(e.numericPrice)} / person`,
    numericPrice: e.numericPrice,
    originalPrice: e.originalPrice,
    difficulty: e.difficulty,
    ageLimit: e.ageLimit,
    groupSize: e.groupSize,
    image: e.image,
    description: e.description,
    featured: e.featured,
    acceptingBookings: (e as any).acceptingBookings !== false,
    status: e.status,
    ...extra,
  };
}
