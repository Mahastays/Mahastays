import { z } from 'zod';

export const createPlaceSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(140).optional(),
  category: z.string().min(2).max(50),
  vicinity: z.string().min(2).max(100),
  shortDescription: z.string().min(10).max(300),
  description: z.string().min(20).max(5000),
  address: z.string().max(255).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.string().max(50).optional(),
  images: z.array(z.string().url()).optional().default([]),
  coverImage: z.string().url().optional(),
  timings: z.string().max(100).optional(),
  entryFee: z.string().max(100).optional(),
  bestTimeToVisit: z.string().max(100).optional(),
  highlights: z.array(z.string().max(120)).optional().default([]),
  tips: z.array(z.string().max(250)).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
  order: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updatePlaceSchema = createPlaceSchema.partial();

export const placeQuerySchema = z.object({
  category: z.string().optional(),
  vicinity: z.string().optional(),
  search: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(24),
});

