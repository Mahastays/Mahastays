import type { Experience } from '@prisma/client';
import { formatInr } from '../../utils/money';
import { omit } from '../../utils/object';

const formatExperiencePrice = (amount: number, priceType?: string | null) => {
  if (priceType === 'per_activity' || priceType === 'full_setup') {
    return `${formatInr(amount)} / setup`;
  }
  if (priceType === 'per_night') {
    return `${formatInr(amount)} / night`;
  }
  return `${formatInr(amount)} / person`;
};

export function presentExperience(e: Experience) {
  const slotPrices = [
    ...(e.slots || []).map((s) => Number(s.price)),
    ...(e.tiers || []).map((t) => Number(t.pricePerPerson)),
  ].filter((v) => !isNaN(v) && v > 0);
  const startingPrice = slotPrices.length > 0 ? Math.min(...slotPrices) : e.numericPrice;
  const effectivePriceType =
    (e.tiers && e.tiers.length > 0 && (e.tiers[0] as any).priceType) ||
    e.priceType ||
    'per_person';
  const effectivePersonLimit =
    e.personLimit ??
    (e.tiers && e.tiers.length > 0 ? (e.tiers[0] as any).personLimit : null) ??
    (e.slots?.[0]?.capacity || null);
  const locType = (e as any).locationType ?? 'fixed_location';
  const displayLoc =
    locType === 'customer_location'
      ? 'At Your Stay / Villa'
      : locType === 'both'
      ? 'Host Venue or At Your Stay'
      : (e as any).location ?? e.city ?? e.meetingPoint?.split(',')[0]?.trim() ?? 'Mahabaleshwar';

  return {
    ...omit(e, 'slots', 'tiers', 'guide'),
    _id: e.id,
    name: e.title,
    location: displayLoc,
    locationType: locType,
    serviceArea: (e as any).serviceArea ?? null,
    rating: e.rating > 0 ? `${e.rating.toFixed(1)}/5 ★` : 'New',
    ratingScore: e.rating,
    priceType: effectivePriceType,
    personLimit: effectivePersonLimit,
    price: formatExperiencePrice(startingPrice, effectivePriceType),
    numericPrice: startingPrice,
    hasChildPrice: (e as any).hasChildPrice ?? (e.pricingRules as any)?.hasChildPrice ?? false,
    childPrice: (e as any).childPrice ?? (e.pricingRules as any)?.childPrice ?? null,
    childAgeLimit: (e as any).childAgeLimit ?? (e.pricingRules as any)?.childAgeLimit ?? null,
    pricingRules: e.pricingRules ?? null,
    acceptingBookings: (e as any).acceptingBookings !== false,
    slots: e.slots.map((s) => ({ ...s, id: s.slotId, availableSpots: s.capacity, price: s.price ?? startingPrice })),
    tiers: e.tiers.map((t) => ({
      ...t,
      id: t.tierId,
      priceType: (t as any).priceType ?? effectivePriceType,
      personLimit: (t as any).personLimit ?? effectivePersonLimit,
      childPricePerPerson: (t as any).childPricePerPerson ?? null,
      badge: (t as any).badge ?? null,
      description: (t as any).description ?? null,
    })),
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
  const effectivePriceType =
    (e.tiers && e.tiers.length > 0 && (e.tiers[0] as any).priceType) ||
    e.priceType ||
    'per_person';
  const effectivePersonLimit =
    e.personLimit ??
    (e.tiers && e.tiers.length > 0 ? (e.tiers[0] as any).personLimit : null) ??
    (e.slots?.[0]?.capacity || null);

  return {
    id: e.id,
    _id: e.id,
    slug: e.slug,
    title: e.title,
    name: e.title,
    country: e.country,
    flag: e.flag,
    city: e.city,
    locationType: (e as any).locationType ?? 'fixed_location',
    serviceArea: (e as any).serviceArea ?? null,
    location:
      (e as any).locationType === 'customer_location'
        ? 'At Your Stay / Villa'
        : (e as any).locationType === 'both'
        ? 'Host Venue or At Your Stay'
        : (e as any).location ?? e.city ?? e.meetingPoint?.split(',')[0]?.trim() ?? 'Mahabaleshwar',
    meetingPoint: e.meetingPoint,
    serviceableLocation: e.serviceableLocation,
    coordinates: e.coordinates,
    locationId: e.locationId,
    duration: e.duration,
    category: e.category,
    priceType: effectivePriceType,
    personLimit: effectivePersonLimit,
    rating: e.rating > 0 ? `${e.rating.toFixed(1)}/5 ★` : 'New',
    ratingScore: e.rating,
    reviewsCount: e.reviewsCount,
    price: formatExperiencePrice(startingPrice, effectivePriceType),
    numericPrice: startingPrice,
    originalPrice: e.originalPrice,
    hasChildPrice: (e as any).hasChildPrice ?? (e.pricingRules as any)?.hasChildPrice ?? false,
    childPrice: (e as any).childPrice ?? (e.pricingRules as any)?.childPrice ?? null,
    childAgeLimit: (e as any).childAgeLimit ?? (e.pricingRules as any)?.childAgeLimit ?? null,
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
