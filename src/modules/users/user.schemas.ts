import { z } from 'zod';
import * as v from '../../utils/zod';

export const updateProfileSchema = z
  .object({
    fullName: v.trimmed(2, 120),
    dateOfBirth: v.isoDate.refine((d) => d < new Date().toISOString().slice(0, 10), 'Date of birth must be in the past'),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
    avatarUrl: z.string().trim().max(2000000).nullable().optional(),
    phone: v.phone,
    preferences: z
      .object({
        preferredLanguage: z.enum(['en', 'hi', 'mr']),
        currency: z.literal('INR'),
        dietaryPreference: z.enum(['veg', 'non-veg', 'jain', 'vegan']),
      })
      .partial(),
  })
  .partial()
  .refine((b) => Object.keys(b).length > 0, { message: 'Provide at least one field to update' });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
