import { z } from 'zod';
import { WEEKDAY_KEYS } from '../../config/constants';
import { paginationSchema } from '../../utils/pagination';
import * as v from '../../utils/zod';

export const DIFFICULTIES = ['Easy', 'Moderate', 'Challenging'] as const;

const inclusionSchema = z.object({ title: v.trimmed(2, 120), desc: v.optionalTrimmed(500), icon: v.optionalTrimmed(40) });
const timelineSchema = z.object({ time: v.trimmed(2, 30), title: v.trimmed(2, 120), desc: v.optionalTrimmed(500) });

const slotSchema = z.object({
  slotId: z.string().trim().min(1).max(60).optional(),
  time: z.string().trim().default('07:00 AM'),
  label: z.string().trim().default('Morning Batch'),
  capacity: z.number().int().min(1).max(2000).default(20),
  price: z.number().int().positive().max(10_000_000).optional(),
});

const scheduleSchema = z.object({
  mode: z.enum(['fixed_slot', 'flexible']).default('fixed_slot'),
  daysAvailable: z.array(z.enum(['all', ...WEEKDAY_KEYS])).min(1).default(['all']),
});

const tierSchema = z
  .object({
    tierId: z.string().trim().min(1).max(60).optional(),
    name: v.trimmed(1, 120),
    badge: v.optionalTrimmed(60),
    tagline: v.optionalTrimmed(200),
    description: v.optionalTrimmed(500),
    priceType: z.enum(['per_person', 'per_activity', 'full_setup', 'per_night']).default('per_person').optional(),
    personLimit: z.number().int().positive().optional(),
    pricePerPerson: z.number().int().positive().max(10_000_000),
    childPricePerPerson: z.number().int().nonnegative().max(10_000_000).optional(),
    originalPrice: z.number().int().positive().max(10_000_000).optional(),
    features: z.array(v.trimmed(1, 160)).max(20).default([]),
  })
  .refine((t) => !t.originalPrice || t.originalPrice >= t.pricePerPerson, { message: 'originalPrice must be ≥ pricePerPerson', path: ['originalPrice'] });

const experienceBase = z.object({
  code: v.optionalTrimmed(60),
  title: v.trimmed(1, 150),
  country: z.string().trim().max(60).default('India'),
  flag: v.optionalTrimmed(8),
  city: v.trimmed(1, 80),
  locationId: v.optionalTrimmed(80),
  duration: z.string().trim().default('4 Hours'),
  category: z.string().trim().min(1).max(100).default('Trekking & Hiking'),
  priceType: z.enum(['per_person', 'per_activity', 'full_setup', 'per_night']).default('per_person').optional(),
  personLimit: z.number().int().min(1).max(2000).optional(),
  difficulty: z.enum(DIFFICULTIES).default('Easy'),
  ageLimit: v.optionalTrimmed(60),
  groupSize: v.optionalTrimmed(80),
  language: v.optionalTrimmed(120),
  image: z.string().trim().optional(),
  gallery: z.array(z.string().trim()).max(40).default([]),
  description: z.string().trim().default(''),
  overview: v.optionalTrimmed(8000),
  highlights: z.array(z.string().trim()).max(50).default([]),
  timeline: z.array(timelineSchema).max(30).default([]),
  inclusions: z.array(inclusionSchema).max(30).default([]),
  exclusions: z.array(v.trimmed(1, 200)).max(30).default([]),
  whatToBring: z.array(v.trimmed(1, 120)).max(30).default([]),
  locationType: z.enum(['fixed_location', 'customer_location', 'both']).default('fixed_location').optional(),
  serviceArea: v.optionalTrimmed(200),
  meetingPoint: v.optionalTrimmed(300),
  coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(),
  schedule: scheduleSchema.optional(),
  slots: z.array(slotSchema).default([]),
  tiers: z.array(tierSchema).default([]),
  numericPrice: z.number().optional(),
  originalPrice: z.number().optional(),
  hasChildPrice: z.boolean().optional(),
  childPrice: z.number().int().nonnegative().optional(),
  childAgeLimit: v.optionalTrimmed(60),
  acceptingBookings: z.boolean().default(true).optional(),
  pricingRules: z.any().optional(),
  guide: z.object({ name: z.string().optional(), role: z.string().optional(), avatar: z.string().optional() }).optional(),
  cancellationPolicy: v.optionalTrimmed(500),
});

const unique = (label: string, ids: (string | undefined)[], ctx: z.RefinementCtx, path: string) => {
  const defined = ids.filter(Boolean);
  if (new Set(defined).size !== defined.length) ctx.addIssue({ code: 'custom', path: [path], message: `${label} values must be unique` });
};

const crossChecks = (e: Partial<z.infer<typeof experienceBase>>, ctx: z.RefinementCtx) => {
  if (e.slots && e.slots.length > 0) unique('slotId', e.slots.map((s) => s.slotId), ctx, 'slots');
  if (e.tiers && e.tiers.length > 0) unique('tierId', e.tiers.map((t) => t.tierId), ctx, 'tiers');
};

export const createExperienceSchema = experienceBase.superRefine(crossChecks);
export const updateExperienceSchema = experienceBase
  .partial()
  .superRefine(crossChecks)
  .refine((e) => Object.keys(e).length > 0, { message: 'Provide at least one field to update' });
export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;

export const listExperiencesQuery = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  destination: z.string().trim().max(100).optional(),
  category: v.csv.pipe(z.array(z.string().trim())).optional(),
  difficulty: v.csv.pipe(z.array(z.enum(DIFFICULTIES))).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  date: v.isoDate.optional(),
  participants: z.coerce.number().int().min(1).max(100).optional(),
  featured: v.boolQuery.optional(),
  sort: z.enum(['recommended', 'price_asc', 'price_desc', 'rating', 'popular', 'newest']).default('recommended'),
});
export type ListExperiencesQuery = z.infer<typeof listExperiencesQuery>;

export const slotsQuery = z.object({ date: v.isoDate });

export const experienceBlockSchema = z
  .object({ slotId: z.string().trim().min(2).max(60).optional(), fromDate: v.isoDate, toDate: v.isoDate, reason: v.optionalTrimmed(200) })
  .refine((b) => b.toDate >= b.fromDate, { message: 'toDate must be on or after fromDate', path: ['toDate'] });

/** PUT /vendor/experiences/:id/slots — slot capacities & weekly schedule only. */
export const updateSlotsSchema = z
  .object({ slots: z.array(slotSchema).min(1).max(20), schedule: scheduleSchema.optional() })
  .superRefine((e, ctx) => unique('slotId', e.slots.map((s) => s.slotId), ctx, 'slots'));
