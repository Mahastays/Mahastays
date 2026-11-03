import { z } from 'zod';
import { isValidIsoDate } from './dates';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const isoDate = z.string().refine(isValidIsoDate, 'Expected a valid date in YYYY-MM-DD format');

export const email = z.string().trim().toLowerCase().pipe(z.email('Invalid email address'));

export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

export const phone = z.union([
  z.object({
    countryCode: z.string().regex(/^\+\d{1,4}$/, 'Country code must look like +91'),
    nationalNumber: z.string().regex(/^\d{6,14}$/, 'Phone number must be 6-14 digits'),
  }),
  z.string().transform((str) => {
    const digits = str.replace(/\D/g, '');
    const nationalNumber = digits.length > 10 ? digits.slice(-10) : digits;
    const countryCode = str.startsWith('+') ? str.slice(0, str.length - nationalNumber.length) || '+91' : '+91';
    return { countryCode: countryCode || '+91', nationalNumber };
  }),
]);

export const trimmed = (min = 1, max = 500) => z.string().trim().min(min).max(max);

export const optionalTrimmed = (max = 500) => z.string().trim().max(max).optional();

export const url = z.string().trim().url().max(2048);

export const positiveInt = z.number().int().positive();
export const nonNegativeInt = z.number().int().min(0);

/** `?tags=a,b,c` -> ['a','b','c'] */
export const csv = z
  .string()
  .transform((s) =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  );

/** `?featured=true` -> true */
export const boolQuery = z.enum(['true', 'false']).transform((v) => v === 'true');

/** Express 5 leaves req.body undefined when no body was sent. */
export const bodyOf = (req: { body?: unknown }): unknown => req.body ?? {};
