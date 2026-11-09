import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';
import * as v from '../../utils/zod';

export const PACKAGE_TYPES = ['couple', 'bachelor_party', 'corporate', 'birthday'] as const;
export const PACKAGE_CATEGORIES = ['Honeymoon', 'Luxury', 'Adventure', 'Heritage'] as const;

const inclusionSchema = z.object({ title: v.trimmed(2, 120), desc: v.optionalTrimmed(500), icon: v.optionalTrimmed(40) });

const itineraryDaySchema = z.object({
  day: z.number().int().min(1).max(30),
  title: v.trimmed(2, 160),
  activities: z.array(v.trimmed(1, 200)).max(20).default([]),
  meals: v.optionalTrimmed(120),
  stay: v.optionalTrimmed(160),
  image: v.url.optional(),
});

const tierSchema = z
  .object({
    tierId: z.string().trim().min(2).max(60).optional(),
    name: v.trimmed(2, 120),
    badge: v.optionalTrimmed(40),
    tagline: v.optionalTrimmed(200),
    hotelType: v.optionalTrimmed(160),
    pricePerPerson: z.number().int().positive().max(10_000_000),
    originalPrice: z.number().int().positive().max(10_000_000).optional(),
    features: z.array(v.trimmed(1, 160)).max(20).default([]),
  })
  .refine((t) => !t.originalPrice || t.originalPrice >= t.pricePerPerson, { message: 'originalPrice must be ≥ pricePerPerson', path: ['originalPrice'] });

/** Free activity passes reference an Experience; name / image / category are filled from it. */
const freeActivitySchema = z.object({ experienceId: v.objectId, time: v.optionalTrimmed(60) });

const packageBase = z.object({
  propertyId: v.objectId,
  packageType: z.enum(PACKAGE_TYPES),
  category: z.enum(PACKAGE_CATEGORIES),
  title: v.trimmed(3, 150),
  badge: v.optionalTrimmed(60),
  priceType: z.enum(['per_person', 'per_night']).default('per_person').optional(),
  personLimit: z.number().int().min(1).max(200).optional(),
  durationDays: z.number().int().min(1).max(30),
  durationNights: z.number().int().min(0).max(29),
  location: v.trimmed(3, 250),
  locationId: v.optionalTrimmed(80),
  city: v.trimmed(2, 80),
  country: z.string().trim().max(60).default('India'),
  shortDesc: v.trimmed(10, 300),
  description: v.optionalTrimmed(3000),
  overview: v.optionalTrimmed(8000),
  thumbnail: v.url.optional(),
  images: z.array(v.url).max(30).default([]),
  freeActivities: z.array(freeActivitySchema).max(10).default([]),
  highlights: z.array(v.trimmed(1, 200)).max(20).default([]),
  inclusions: z.array(inclusionSchema).max(30).default([]),
  /** Type-specific flags (couple / bachelor / corporate / birthday) — free-form JSON the frontend reads as-is. */
  rawInclusions: z.record(z.string(), z.unknown()).optional(),
  exclusions: z.array(v.trimmed(1, 200)).max(30).default([]),
  itinerary: z.array(itineraryDaySchema).max(30).default([]),
  tiers: z.array(tierSchema).min(1).max(10),
  pricing: z
    .object({
      weekendSurcharge: z.number().int().min(0).max(1_000_000).default(0),
      childPrice: z.number().int().positive().max(10_000_000).optional(),
      minGuests: z.number().int().min(1).max(100).default(1),
      maxGuests: z.number().int().min(1).max(200),
    })
    .refine((p) => p.maxGuests >= p.minGuests, { message: 'maxGuests must be ≥ minGuests', path: ['maxGuests'] }),
  validFrom: v.isoDate.optional(),
  validTill: v.isoDate.optional(),
  cancellationPolicy: v.optionalTrimmed(500),
  pricingRules: z.any().optional(),
});

const crossChecks = (p: Partial<z.infer<typeof packageBase>>, ctx: z.RefinementCtx) => {
  if (p.durationNights !== undefined && p.durationDays !== undefined && p.durationNights >= p.durationDays) {
    ctx.addIssue({ code: 'custom', path: ['durationNights'], message: 'durationNights must be less than durationDays' });
  }
  if (p.validFrom && p.validTill && p.validTill < p.validFrom) {
    ctx.addIssue({ code: 'custom', path: ['validTill'], message: 'validTill must be on or after validFrom' });
  }
  if (p.itinerary) {
    const days = p.itinerary.map((d) => d.day);
    if (new Set(days).size !== days.length) ctx.addIssue({ code: 'custom', path: ['itinerary'], message: 'Itinerary days must be unique' });
    if (p.durationDays !== undefined && days.some((d) => d > p.durationDays!)) {
      ctx.addIssue({ code: 'custom', path: ['itinerary'], message: 'Itinerary has days beyond durationDays' });
    }
  }
  if (p.tiers) {
    const ids = p.tiers.map((t) => t.tierId).filter(Boolean);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', path: ['tiers'], message: 'tierId values must be unique' });
  }
};

export const createPackageSchema = packageBase.superRefine(crossChecks);
export const updatePackageSchema = packageBase
  .partial()
  .superRefine(crossChecks)
  .refine((p) => Object.keys(p).length > 0, { message: 'Provide at least one field to update' });
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;

export const listPackagesQuery = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  destination: z.string().trim().max(100).optional(),
  category: v.csv.pipe(z.array(z.enum(PACKAGE_CATEGORIES))).optional(),
  packageType: v.csv.pipe(z.array(z.enum(PACKAGE_TYPES))).optional(),
  propertyId: v.objectId.optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxDays: z.coerce.number().int().min(1).max(30).optional(),
  featured: v.boolQuery.optional(),
  sort: z.enum(['recommended', 'price_asc', 'price_desc', 'rating', 'popular', 'newest']).default('recommended'),
});
export type ListPackagesQuery = z.infer<typeof listPackagesQuery>;
