import { z } from 'zod';

export const createHeroSlideSchema = z.object({
  title: z.string().trim().min(2, 'Heading title is required').max(200),
  subtitle: z.string().trim().max(250).optional().default(''),
  paragraph: z.string().trim().max(600).optional().default(''),
  image: z.string().trim().min(5, 'Image URL is required'),
  cloudinaryPublicId: z.string().trim().optional(),
  badge: z.string().trim().max(60).optional().default('Curated Collection'),
  ctaText: z.string().trim().max(60).optional().default('Explore Stays'),
  ctaLink: z.string().trim().max(250).optional().default('/explore'),
  order: z.coerce.number().int().min(0).max(9999).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateHeroSlideSchema = createHeroSlideSchema.partial();

export const heroSlideToggleSchema = z.object({
  isActive: z.boolean(),
});

export type CreateHeroSlideInput = z.infer<typeof createHeroSlideSchema>;
export type UpdateHeroSlideInput = z.infer<typeof updateHeroSlideSchema>;

