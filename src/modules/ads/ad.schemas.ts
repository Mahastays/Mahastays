import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';
import * as v from '../../utils/zod';

export const AD_TYPES = ['banner', 'card', 'sidebar', 'popup'] as const;
export const AD_PLACEMENTS = ['homepage', 'search_results', 'property_page', 'all'] as const;
export const AD_TARGET_TYPES = ['package', 'property', 'activity'] as const;
const DEVICES = ['desktop', 'mobile', 'tablet'] as const;

const targetingSchema = z.object({
  locations: z.array(v.trimmed(1, 80)).max(30).default([]),
  userRoles: z.array(v.trimmed(1, 40)).max(10).default([]),
  interests: z.array(v.trimmed(1, 60)).max(30).default([]),
  occasions: z.array(v.trimmed(1, 60)).max(30).default([]),
  userAgeRange: z
    .object({ min: z.number().int().min(0).max(120), max: z.number().int().min(0).max(120) })
    .refine((r) => r.max >= r.min, { message: 'max must be ≥ min', path: ['max'] })
    .optional(),
  device: z.array(z.enum(DEVICES)).max(3).default([]),
  showOnPages: z.array(z.string().trim().regex(/^\//, 'Pages must start with "/"')).max(20).default([]),
});

const budgetSchema = z.object({
  totalBudget: z.number().min(0).max(100_000_000),
  dailyBudget: z.number().min(0).max(100_000_000).optional(),
  costPerClick: z.number().min(0).max(100_000).default(0),
  costPerImpression: z.number().min(0).max(1_000).default(0),
});

const adBase = z.object({
  adName: v.trimmed(3, 120),
  adType: z.enum(AD_TYPES),
  placement: z.enum(AD_PLACEMENTS).default('all'),
  target: z.object({ targetType: z.enum(AD_TARGET_TYPES), targetId: v.objectId, ctaLink: z.string().trim().max(300).regex(/^\//, 'ctaLink must be an in-app path like /packages/123').optional() }),
  creative: z.object({
    headline: v.trimmed(3, 150),
    subHeadline: v.optionalTrimmed(250),
    imageUrl: v.url,
    badgeText: v.optionalTrimmed(40),
    buttonText: v.optionalTrimmed(40),
  }),
  targeting: targetingSchema.optional(),
  budget: budgetSchema,
  priority: z.number().int().min(1).max(10).default(5),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

const dateOrder = (a: { startsAt?: Date; expiresAt?: Date }) => !a.startsAt || !a.expiresAt || a.expiresAt > a.startsAt;

export const createAdSchema = adBase.refine(dateOrder, { message: 'expiresAt must be after startsAt', path: ['expiresAt'] });
export const updateAdSchema = adBase
  .partial()
  .refine(dateOrder, { message: 'expiresAt must be after startsAt', path: ['expiresAt'] })
  .refine((a) => Object.keys(a).length > 0, { message: 'Provide at least one field to update' });
export type CreateAdInput = z.infer<typeof createAdSchema>;
export type UpdateAdInput = z.infer<typeof updateAdSchema>;

export const activeAdsQuery = z.object({
  placement: z.enum(['homepage', 'search_results', 'property_page', 'all', 'packages', 'experiences', 'stays', 'home']).optional(),
  adType: z.enum(AD_TYPES).optional(),
  page: z.string().trim().max(200).optional(),
  device: z.enum(DEVICES).optional(),
  city: z.string().trim().max(80).optional(),
  occasion: v.csv.optional(),
  interests: v.csv.optional(),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});
export type ActiveAdsQuery = z.infer<typeof activeAdsQuery>;

export const trackSchema = z.object({ adId: v.objectId });

export const adListQuery = paginationSchema.extend({
  approved: v.boolQuery.optional(),
  active: v.boolQuery.optional(),
  q: z.string().trim().max(100).optional(),
});

export const approvalSchema = z.object({ approved: z.boolean() });
export const adToggleSchema = z.object({ isActive: z.boolean() });
