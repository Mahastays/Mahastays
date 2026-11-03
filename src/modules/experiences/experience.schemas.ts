import { z } from 'zod';
import { EXPERIENCE_CATEGORIES, WEEKDAY_KEYS } from '../../config/constants';
import { paginationSchema } from '../../utils/pagination';
import * as v from '../../utils/zod';

export const DIFFICULTIES = ['Easy', 'Moderate', 'Challenging'] as const;

const inclusionSchema = z.object({ title: v.trimmed(2, 120), desc: v.optionalTrimmed(500), icon: v.optionalTrimmed(40) });
const timelineSchema = z.object({ time: v.trimmed(2, 30), title: v.trimmed(2, 120), desc: v.optionalTrimmed(500) });

const slotSchema = z.object({
  slotId: z.string().trim().min(2).max(60).optional(),
  time: v.trimmed(3, 40),
  label: v.trimmed(2, 80),
  capacity: z.number().int().min(1).max(2000),
  price: z.number().int().positive().max(10_000_000).optional(),
});

const scheduleSchema = z.object({
  mode: z.enum(['fixed_slot', 'flexible']).default('fixed_slot'),
  daysAvailable: z.array(z.enum(['all', ...WEEKDAY_KEYS])).min(1).default(['all']),
});

const tierSchema = z
  .object({
    tierId: z.string().trim().min(2).max(60).optional(),
    name: v.trimmed(2, 120),
    tagline: v.optionalTrimmed(200),
    pricePerPerson: z.number().int().positive().max(10_000_000),
    originalPrice: z.number().int().positive().max(10_000_000).optional(),
    features: z.array(v.trimmed(1, 160)).max(20).default([]),
  })
  .refine((t) => !t.originalPrice || t.originalPrice >= t.pricePerPerson, { message: 'originalPrice must be ≥ pricePerPerson', path: ['originalPrice'] });

const experienceBase = z.object({
  title: v.trimmed(3, 150),
  country: z.string().trim().max(60).default('India'),
  flag: v.optionalTrimmed(8),
  city: v.trimmed(2, 80),
  locationId: v.optionalTrimmed(80),
  duration: v.trimmed(2, 100),
  category: z.enum(EXPERIENCE_CATEGORIES),
  difficulty: z.enum(DIFFICULTIES).default('Easy'),
  ageLimit: v.optionalTrimmed(60),
  groupSize: v.optionalTrimmed(80),
  language: v.optionalTrimmed(120),
  image: v.url.optional(),
  gallery: z.array(v.url).max(40).default([]),
  description: v.trimmed(10, 1500),
  overview: v.optionalTrimmed(8000),
  highlights: z.array(v.trimmed(1, 200)).max(20).default([]),
  timeline: z.array(timelineSchema).max(30).default([]),
  inclusions: z.array(inclusionSchema).max(30).default([]),
  exclusions: z.array(v.trimmed(1, 200)).max(30).default([]),
  whatToBring: z.array(v.trimmed(1, 120)).max(30).default([]),
  meetingPoint: v.optionalTrimmed(300),
  coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(),
  schedule: scheduleSchema.optional(),
  slots: z.array(slotSchema).min(1).max(20),
  tiers: z.array(tierSchema).min(1).max(10),
  guide: z.object({ name: v.trimmed(2, 100), role: v.optionalTrimmed(120), avatar: v.url.optional() }).optional(),
  cancellationPolicy: v.optionalTrimmed(500),
});

const unique = (label: string, ids: (string | undefined)[], ctx: z.RefinementCtx, path: string) => {
  const defined = ids.filter(Boolean);
  if (new Set(defined).size !== defined.length) ctx.addIssue({ code: 'custom', path: [path], message: `${label} values must be unique` });
};

const crossChecks = (e: Partial<z.infer<typeof experienceBase>>, ctx: z.RefinementCtx) => {
  if (e.slots) unique('slotId', e.slots.map((s) => s.slotId), ctx, 'slots');
  if (e.tiers) unique('tierId', e.tiers.map((t) => t.tierId), ctx, 'tiers');
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
  category: v.csv.pipe(z.array(z.enum(EXPERIENCE_CATEGORIES))).optional(),
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
