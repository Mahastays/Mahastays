import type { Experience, Package, Property } from '@prisma/client';
import { formatInr } from '../../utils/money';
import { omit } from '../../utils/object';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const priceLabel = (n: number) => `From ${formatInr(n)} / person`;
// NOTE: the spec shows "/ couple" on cards but its ledger multiplies the tier price by the number of adults,
// i.e. the price is PER PERSON. The API follows the ledger — see README → "Spec observations".

export function presentPackage(
  pk: Package,
  extra: {
    property?: Pick<Property, 'id' | 'name' | 'propertyType' | 'location' | 'slug'> | null;
    experiences?: Map<string, Pick<Experience, 'id' | 'title' | 'image' | 'category' | 'status'>>;
  } = {},
) {
  return {
    ...omit(pk, 'tiers', 'freeActivities'),
    _id: pk.id,
    hostId: pk.vendorId,
    name: pk.title,
    rating: `${pk.rating.toFixed(1)}/5 ★`,
    ratingScore: pk.rating,
    duration: `${pk.durationDays} Days / ${pk.durationNights} Nights`,
    price: priceLabel(pk.numericPrice),
    pricingUnit: 'person' as const,
    fullDesc: pk.overview ?? pk.description ?? pk.shortDesc,
    hostProperty: extra.property
      ? {
          propertyId: extra.property.id,
          propertyName: extra.property.name,
          propertyType: cap(extra.property.propertyType),
          location: extra.property.location,
          slug: extra.property.slug,
        }
      : { propertyId: pk.propertyId },
    freeActivities: pk.freeActivities.map((a) => {
      const live = a.experienceId ? extra.experiences?.get(a.experienceId) : undefined;
      return {
        id: a.experienceId,
        experienceId: a.experienceId,
        name: live?.title ?? a.name,
        time: a.time,
        image: live?.image ?? a.image,
        category: live?.category ?? a.category,
      };
    }),
    tiers: pk.tiers.map((t) => ({ ...t, id: t.tierId })),
    durationDetails: { nights: pk.durationNights, days: pk.durationDays, validFrom: pk.validFrom, validTill: pk.validTill },
  };
}

export function presentPackageCard(pk: Package, extra: Record<string, unknown> = {}) {
  return {
    id: pk.id,
    _id: pk.id,
    slug: pk.slug,
    propertyId: pk.propertyId,
    packageType: pk.packageType,
    category: pk.category,
    title: pk.title,
    name: pk.title,
    badge: pk.badge,
    rating: `${pk.rating.toFixed(1)}/5 ★`,
    ratingScore: pk.rating,
    reviewsCount: pk.reviewsCount,
    duration: `${pk.durationDays} Days / ${pk.durationNights} Nights`,
    durationDays: pk.durationDays,
    durationNights: pk.durationNights,
    location: pk.location,
    locationId: pk.locationId,
    city: pk.city,
    country: pk.country,
    price: priceLabel(pk.numericPrice),
    numericPrice: pk.numericPrice,
    originalPrice: pk.originalPrice,
    pricingUnit: 'person' as const,
    shortDesc: pk.shortDesc,
    thumbnail: pk.thumbnail,
    featured: pk.featured,
    acceptingBookings: (pk as any).acceptingBookings !== false,
    status: pk.status,
    ...extra,
  };
}
