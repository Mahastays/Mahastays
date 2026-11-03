import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';
import * as v from '../../utils/zod';

export const PROPERTY_TYPES = ['resort', 'villa', 'hotel', 'cottage', 'apartment'] as const;

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:mm');

export const imageSchema = z.object({ url: v.url, alt: v.optionalTrimmed(200), isCover: z.boolean().default(false) });
export const highlightSchema = z.object({ title: v.trimmed(2, 100), desc: v.trimmed(2, 500), icon: v.optionalTrimmed(40) });
export const amenitySchema = z.object({ name: v.trimmed(2, 80), icon: v.optionalTrimmed(40) });
const attractionSchema = z.object({ name: v.trimmed(2, 120), distance: v.optionalTrimmed(40), time: v.optionalTrimmed(60) });

export const policiesSchema = z.object({
  checkInTime: hhmm.default('14:00'),
  checkOutTime: hhmm.default('11:00'),
  cancellationPolicy: v.optionalTrimmed(500),
  /** Overrides the platform default (48 h) for this property. */
  freeCancellationHours: z.number().int().min(0).max(24 * 30).optional(),
  lateCancellationFeePercent: z.number().min(0).max(100).optional(),
  petsAllowed: z.boolean().default(false),
  smokingAllowed: z.boolean().default(false),
  coupleFriendly: z.boolean().default(true),
  maxGuestsPerRoom: z.number().int().positive().max(30).optional(),
});

export const roomSchema = z
  .object({
    /** Send the existing id to keep a room's bookings attached; omit for new rooms. */
    roomId: z.string().trim().min(2).max(40).optional(),
    name: v.trimmed(2, 120),
    badge: v.optionalTrimmed(40),
    tagline: v.optionalTrimmed(200),
    roomSize: z.number().int().positive().max(20_000).optional(),
    bedType: v.optionalTrimmed(40),
    maxGuests: z.number().int().min(1).max(30),
    capacity: z.object({ adults: z.number().int().min(1).max(30), children: z.number().int().min(0).max(30) }),
    basePrice: z.number().int().positive().max(10_000_000),
    originalPrice: z.number().int().positive().max(10_000_000).optional(),
    weekendPrice: z.number().int().positive().max(10_000_000).optional(),
    holidayPrice: z.number().int().positive().max(10_000_000).optional(),
    count: z.number().int().min(1).max(500).default(1),
    images: z.array(v.url).max(20).default([]),
    amenities: z.array(v.trimmed(1, 80)).max(40).default([]),
  })
  .refine((r) => !r.originalPrice || r.originalPrice >= r.basePrice, { message: 'originalPrice must be ≥ basePrice', path: ['originalPrice'] });

const propertyBase = z.object({
  name: v.trimmed(3, 150),
  propertyType: z.enum(PROPERTY_TYPES),
  tagline: v.optionalTrimmed(250),
  badge: v.optionalTrimmed(60),
  tags: z.array(v.trimmed(1, 40)).max(30).default([]),
  description: v.trimmed(10, 1000),
  longDescription: v.optionalTrimmed(8000),
  location: v.trimmed(3, 200),
  locationId: v.optionalTrimmed(80),
  city: v.trimmed(2, 80),
  country: z.string().trim().max(60).default('India'),
  address: z.object({
    fullAddress: v.trimmed(5, 300),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    mapLink: v.url.optional(),
  }),
  images: z.array(imageSchema).min(1).max(30),
  gallery: z.array(v.url).max(60).default([]),
  videos: z.array(v.url).max(10).default([]),
  host: z
    .object({ name: v.trimmed(2, 100), role: v.optionalTrimmed(100), experience: v.optionalTrimmed(200), avatar: v.url.optional() })
    .optional(),
  highlights: z.array(highlightSchema).max(12).default([]),
  amenities: z.array(amenitySchema).max(60).default([]),
  policies: policiesSchema.optional(),
  rooms: z.array(roomSchema).min(1).max(30),
  attractions: z.array(attractionSchema).max(20).default([]),
  bgColor: v.optionalTrimmed(120),
  gradientOverlay: v.optionalTrimmed(160),
});

const uniqueRoomIds = (rooms?: { roomId?: string }[]) => {
  if (!rooms) return true;
  const ids = rooms.map((r) => r.roomId).filter(Boolean);
  return new Set(ids).size === ids.length;
};

export const createPropertySchema = propertyBase.refine((p) => uniqueRoomIds(p.rooms), { message: 'roomId values must be unique', path: ['rooms'] });
export const updatePropertySchema = propertyBase
  .partial()
  .refine((p) => uniqueRoomIds(p.rooms), { message: 'roomId values must be unique', path: ['rooms'] })
  .refine((p) => Object.keys(p).length > 0, { message: 'Provide at least one field to update' });

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

export const listPropertiesQuery = paginationSchema
  .extend({
    q: z.string().trim().max(100).optional(),
    destination: z.string().trim().max(100).optional(),
    type: v.csv.pipe(z.array(z.enum(PROPERTY_TYPES))).optional(),
    amenities: v.csv.optional(),
    tags: v.csv.optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    checkIn: v.isoDate.optional(),
    checkOut: v.isoDate.optional(),
    guests: z.coerce.number().int().min(1).max(60).optional(),
    featured: v.boolQuery.optional(),
    sort: z.enum(['recommended', 'price_asc', 'price_desc', 'rating', 'popular', 'newest']).default('recommended'),
  })
  .refine((q) => (q.checkIn === undefined) === (q.checkOut === undefined), { message: 'Provide both checkIn and checkOut', path: ['checkOut'] })
  .refine((q) => !q.checkIn || !q.checkOut || q.checkOut > q.checkIn, { message: 'checkOut must be after checkIn', path: ['checkOut'] });
export type ListPropertiesQuery = z.infer<typeof listPropertiesQuery>;

export const propertyDetailQuery = z
  .object({ checkIn: v.isoDate.optional(), checkOut: v.isoDate.optional(), guests: z.coerce.number().int().min(1).max(60).optional() })
  .refine((q) => (q.checkIn === undefined) === (q.checkOut === undefined), { message: 'Provide both checkIn and checkOut', path: ['checkOut'] })
  .refine((q) => !q.checkIn || !q.checkOut || q.checkOut > q.checkIn, { message: 'checkOut must be after checkIn', path: ['checkOut'] });

export const nearbyQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.5).max(200).default(25),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const vendorListQuery = paginationSchema.extend({
  status: z.enum(['pending_approval', 'active', 'inactive', 'rejected', 'blocked', 'archived']).optional(),
  q: z.string().trim().max(100).optional(),
});

export const visibilitySchema = z.object({ status: z.enum(['active', 'inactive']) });

export const blockSchema = z
  .object({
    roomId: z.string().trim().min(2).max(40).optional(),
    fromDate: v.isoDate,
    toDate: v.isoDate,
    units: z.number().int().positive().max(500).optional(),
    reason: v.optionalTrimmed(200),
  })
  .refine((b) => b.toDate >= b.fromDate, { message: 'toDate must be on or after fromDate', path: ['toDate'] });

export const calendarQuery = z
  .object({ from: v.isoDate, to: v.isoDate })
  .refine((q) => q.to >= q.from, { message: 'to must be on or after from', path: ['to'] })
  .refine((q) => (new Date(q.to).getTime() - new Date(q.from).getTime()) / 86_400_000 <= 92, { message: 'Range cannot exceed 92 days', path: ['to'] });
