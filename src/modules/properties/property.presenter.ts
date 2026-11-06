import type { Package, Property, Room } from '@prisma/client';
import { to12Hour } from '../../utils/dates';
import { formatInr } from '../../utils/money';
import { omit } from '../../utils/object';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const RATING_LABELS = [
  ['cleanliness', 'Cleanliness'],
  ['accuracy', 'Accuracy'],
  ['communication', 'Communication'],
  ['location', 'Location'],
  ['checkIn', 'Check-in'],
  ['value', 'Value'],
] as const;

/** Room with the frontend's alias fields (roomType, pricePerNight, size, bed, image, ...). */
export function presentRoom(r: Room, extra: { availableUnits?: number } = {}) {
  return {
    ...r,
    id: r.roomId,
    roomType: r.name,
    size: r.roomSize ? `${r.roomSize} sq.ft.` : null,
    bed: r.bedType,
    pricePerNight: r.basePrice,
    image: r.images[0] ?? null,
    roomImages: r.images,
    roomAmenities: r.amenities,
    ...extra,
  };
}

/** Full property in the spec's shape (display aliases are derived, never stored twice). */
export function presentProperty(p: Property, opts: { roomAvailability?: Map<string, number> } = {}) {
  const policies = p.policies;
  const roomPrices = (p.rooms || []).map((r) => Number(r.basePrice)).filter((v) => !isNaN(v) && v > 0);
  const startingPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : p.numericPrice;
  return {
    ...omit(p, 'amenityKeys'),
    _id: p.id,
    type: cap(p.propertyType),
    price: formatInr(startingPrice),
    numericPrice: startingPrice,
    inrPrice: startingPrice,
    pricingRules: p.pricingRules ?? null,
    mapCoordinates: { lat: p.address.lat, lng: p.address.lng },
    hostName: p.host?.name ?? null,
    hostRole: p.host?.role ?? null,
    hostExperience: p.host?.experience ?? null,
    hostAvatar: p.host?.avatar ?? null,
    host: p.host ?? null,
    checkInTime: to12Hour(policies.checkInTime),
    checkOutTime: to12Hour(policies.checkOutTime),
    cancellationPolicy: policies.cancellationPolicy ?? null,
    earlyCheckInNote: policies.earlyCheckInNote ?? null,
    suitabilityRules: policies.suitabilityRules ?? [],
    petsAllowed: policies.petsAllowed,
    smokingAllowed: policies.smokingAllowed,
    coupleFriendly: policies.coupleFriendly,
    maxGuestsPerRoom: policies.maxGuestsPerRoom ?? null,
    rooms: p.rooms.map((r) =>
      presentRoom(r, opts.roomAvailability ? { availableUnits: opts.roomAvailability.get(r.roomId) ?? 0 } : {}),
    ),
    ratingBreakdown: RATING_LABELS.map(([k, label]) => ({ label, score: p.ratingBreakdown[k].toFixed(1) })),
  };
}

/** Lightweight shape for lists (StayCard / PopularHotels). */
export function presentPropertyCard(p: Property, extra: Record<string, unknown> = {}) {
  const roomPrices = (p.rooms || []).map((r) => Number(r.basePrice)).filter((v) => !isNaN(v) && v > 0);
  const startingPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : p.numericPrice;
  return {
    id: p.id,
    _id: p.id,
    slug: p.slug,
    name: p.name,
    propertyType: p.propertyType,
    type: cap(p.propertyType),
    price: formatInr(startingPrice),
    numericPrice: startingPrice,
    inrPrice: startingPrice,
    originalPrice: p.originalPrice,
    pricingRules: p.pricingRules ?? null,
    tagline: p.tagline,
    badge: p.badge,
    tags: p.tags,
    description: p.description,
    location: p.location,
    locationId: p.locationId,
    city: p.city,
    country: p.country,
    mapCoordinates: { lat: p.address.lat, lng: p.address.lng },
    images: p.images,
    rating: p.rating,
    reviewsCount: p.reviewsCount,
    bgColor: p.bgColor,
    gradientOverlay: p.gradientOverlay,
    featured: p.featured,
    acceptingBookings: (p as any).acceptingBookings !== false,
    status: p.status,
    ...extra,
  };
}

/** `curatedPackages` — packages hosted at a property, in the spec's compact shape. */
export function presentCuratedPackage(pk: Package) {
  return {
    id: pk.id,
    _id: pk.id,
    slug: pk.slug,
    title: pk.title,
    badge: pk.badge,
    category: pk.category,
    duration: `${pk.durationDays}D / ${pk.durationNights}N`,
    shortDesc: pk.shortDesc,
    price: formatInr(pk.numericPrice),
    numericPrice: pk.numericPrice,
  };
}
