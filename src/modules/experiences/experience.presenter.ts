import type { Experience } from '@prisma/client';
import { formatInr } from '../../utils/money';
import { omit } from '../../utils/object';

export function presentExperience(e: Experience) {
  const slotPrices = [
    ...(e.slots || []).map((s) => Number(s.price)),
    ...(e.tiers || []).map((t) => Number(t.pricePerPerson)),
  ].filter((v) => !isNaN(v) && v > 0);
  const startingPrice = slotPrices.length > 0 ? Math.min(...slotPrices) : e.numericPrice;
  return {
    ...omit(e, 'slots', 'tiers', 'guide'),
    _id: e.id,
    name: e.title,
    rating: `${e.rating.toFixed(1)}/5 ★`,
    ratingScore: e.rating,
    priceType: e.priceType ?? 'per_person',
    personLimit: e.personLimit ?? (e.slots?.[0]?.capacity || null),
    price: e.priceType === 'per_night' ? `${formatInr(startingPrice)} / night` : `${formatInr(startingPrice)} / person`,
    numericPrice: startingPrice,
    pricingRules: e.pricingRules ?? null,
    slots: e.slots.map((s) => ({ ...s, id: s.slotId, availableSpots: s.capacity, price: s.price ?? startingPrice })),
    tiers: e.tiers.map((t) => ({ ...t, id: t.tierId })),
    guide: e.guide,
    guideName: e.guide?.name ?? null,
    guideRole: e.guide?.role ?? null,
  };
}

export function presentExperienceCard(e: Experience, extra: Record<string, unknown> = {}) {
  const slotPrices = [
    ...(e.slots || []).map((s) => Number(s.price)),
    ...(e.tiers || []).map((t) => Number(t.pricePerPerson)),
  ].filter((v) => !isNaN(v) && v > 0);
  const startingPrice = slotPrices.length > 0 ? Math.min(...slotPrices) : e.numericPrice;
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
    priceType: e.priceType ?? 'per_person',
    personLimit: e.personLimit ?? (e.slots?.[0]?.capacity || null),
    rating: `${e.rating.toFixed(1)}/5 ★`,
    ratingScore: e.rating,
    reviewsCount: e.reviewsCount,
    price: e.priceType === 'per_night' ? `${formatInr(startingPrice)} / night` : `${formatInr(startingPrice)} / person`,
    numericPrice: startingPrice,
    originalPrice: e.originalPrice,
    pricingRules: e.pricingRules ?? null,
    difficulty: e.difficulty,
    ageLimit: e.ageLimit,
    groupSize: e.groupSize,
    image: e.image,
    description: e.description,
    featured: e.featured,
    acceptingBookings: (e as any).acceptingBookings !== false,
    status: e.status,
    vendorId: e.vendorId,
    hostId: e.vendorId,
    slots: e.slots ?? [],
    tiers: e.tiers ?? [],
    guide: e.guide ?? null,
    highlights: e.highlights ?? [],
    inclusions: e.inclusions ?? [],
    exclusions: e.exclusions ?? [],
    ...extra,
  };
}
