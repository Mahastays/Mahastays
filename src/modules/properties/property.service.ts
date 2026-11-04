import type { Prisma, Property } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { uniqueSlug, isObjectId } from '../../utils/slug';
import { randomToken } from '../../utils/crypto';
import { eachNight, todayIST } from '../../utils/dates';
import { boundingBox, haversineKm } from '../../utils/geo';
import { pageMeta, skipTake, sliceItems, type PaginationInput } from '../../utils/pagination';
import { statusAfterVendorEdit, loadOwnedListing } from '../catalog/listing.service';
import { availabilityFor, loadStayOccupancy } from '../inventory/inventory.service';
import { presentReview } from '../reviews/review.presenter';
import { presentVendorPublic } from '../vendors/vendor.presenter';
import {
  policiesSchema,
  type CreatePropertyInput,
  type ListPropertiesQuery,
  type UpdatePropertyInput,
} from './property.schemas';
import { presentCuratedPackage, presentProperty, presentPropertyCard } from './property.presenter';

const MAX_AVAILABILITY_CANDIDATES = 400;

/* ───────────────────────────── helpers ───────────────────────────── */

const whereIdOrSlug = (idOrSlug: string): Prisma.PropertyWhereInput =>
  isObjectId(idOrSlug)
    ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }, { code: idOrSlug }] }
    : { OR: [{ slug: idOrSlug }, { code: idOrSlug }] };

function orderByFor(sort: ListPropertiesQuery['sort']): Prisma.PropertyOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc':
      return [{ numericPrice: 'asc' }];
    case 'price_desc':
      return [{ numericPrice: 'desc' }];
    case 'rating':
      return [{ rating: 'desc' }, { reviewsCount: 'desc' }];
    case 'popular':
      return [{ reviewsCount: 'desc' }, { rating: 'desc' }];
    case 'newest':
      return [{ createdAt: 'desc' }];
    default:
      return [{ featured: 'desc' }, { rating: 'desc' }, { reviewsCount: 'desc' }];
  }
}

type RoomInput = CreatePropertyInput['rooms'][number];

/** Derived fields that must stay consistent with the rooms / amenities. */
function derive(rooms: RoomInput[]) {
  const withIds = rooms.map((r) => ({ ...r, roomId: r.roomId ?? `r-${randomToken(3)}` }));
  const cheapest = withIds.reduce((a, b) => (b.basePrice < a.basePrice ? b : a));
  return { rooms: withIds, numericPrice: cheapest.basePrice, originalPrice: cheapest.originalPrice ?? null };
}

const amenityKeysOf = (amenities: { name: string }[]) => [...new Set(amenities.map((a) => a.name.trim().toLowerCase()))];

function normalizeImages(images: CreatePropertyInput['images']) {
  const hasCover = images.some((i) => i.isCover);
  return images.map((img, i) => ({ ...img, isCover: hasCover ? img.isCover : i === 0 }));
}

/* ───────────────────────────── public reads ───────────────────────────── */

export async function listProperties(q: ListPropertiesQuery) {
  const and: Prisma.PropertyWhereInput[] = [{ status: 'active' }];
  if (q.q) {
    const contains = { contains: q.q, mode: 'insensitive' as const };
    and.push({ OR: [{ name: contains }, { city: contains }, { location: contains }, { tagline: contains }, { tags: { has: q.q } }] });
  }
  if (q.destination) {
    const contains = { contains: q.destination, mode: 'insensitive' as const };
    and.push({ OR: [{ city: contains }, { location: contains }] });
  }
  if (q.type?.length) and.push({ propertyType: { in: q.type } });
  if (q.amenities?.length) and.push({ amenityKeys: { hasEvery: q.amenities.map((a) => a.toLowerCase()) } });
  if (q.tags?.length) and.push({ tags: { hasSome: q.tags } });
  if (q.minPrice !== undefined || q.maxPrice !== undefined) and.push({ numericPrice: { gte: q.minPrice, lte: q.maxPrice } });
  if (q.minRating !== undefined) and.push({ rating: { gte: q.minRating } });
  if (q.featured !== undefined) and.push({ featured: q.featured });
  const where: Prisma.PropertyWhereInput = { AND: and };
  const orderBy = orderByFor(q.sort);

  // No dates → plain database pagination.
  if (!q.checkIn || !q.checkOut) {
    const [total, rows] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({ where, orderBy, ...skipTake(q) }),
    ]);
    return { items: rows.map((p) => presentPropertyCard(p)), meta: pageMeta(q, total) };
  }

  // With dates → keep only properties that still have a free room (and enough capacity for the party).
  const candidates = await prisma.property.findMany({ where, orderBy, take: MAX_AVAILABILITY_CANDIDATES });
  const nights = eachNight(q.checkIn, q.checkOut);
  const occupancy = await loadStayOccupancy(candidates, q.checkIn, q.checkOut);
  const available = candidates.flatMap((p) => {
    const rooms = p.rooms
      .map((room) => ({ room, free: availabilityFor(occupancy, p.id, room, nights).availableUnits }))
      .filter((r) => r.free > 0);
    if (rooms.length === 0) return [];
    const capacity = rooms.reduce((sum, r) => sum + r.free * r.room.maxGuests, 0);
    if (q.guests && capacity < q.guests) return [];
    const startingPrice = Math.min(...rooms.map((r) => r.room.basePrice));
    return [presentPropertyCard(p, { availableRooms: rooms.length, startingPriceForDates: startingPrice })];
  });
  return sliceItems(available, q);
}

export async function getPropertyPublic(
  idOrSlug: string,
  opts: { checkIn?: string; checkOut?: string; guests?: number } = {},
) {
  const property = await prisma.property.findFirst({ where: { ...whereIdOrSlug(idOrSlug), status: 'active' } });
  if (!property) throw ApiError.notFound('Property');
  return buildDetail(property, opts);
}

/** Detail view shared by public and vendor/admin previews. */
export async function buildDetail(property: Property, opts: { checkIn?: string; checkOut?: string; guests?: number } = {}) {
  let roomAvailability: Map<string, number> | undefined;
  if (opts.checkIn && opts.checkOut) {
    const nights = eachNight(opts.checkIn, opts.checkOut);
    const occupancy = await loadStayOccupancy([property], opts.checkIn, opts.checkOut);
    roomAvailability = new Map(property.rooms.map((r) => [r.roomId, availabilityFor(occupancy, property.id, r, nights).availableUnits]));
  }

  const [vendor, packages, reviews] = await Promise.all([
    prisma.vendor.findUnique({ where: { id: property.vendorId }, select: { id: true, displayName: true, displayRole: true, experienceSummary: true, avatarUrl: true } }),
    prisma.package.findMany({ where: { propertyId: property.id, status: 'active' }, orderBy: [{ featured: 'desc' }, { numericPrice: 'asc' }] }),
    prisma.review.findMany({ where: { targetType: 'property', targetId: property.id, status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 6 }),
  ]);

  const presented = presentProperty(property, { roomAvailability });
  return {
    ...presented,
    host: presented.host ?? (vendor ? { name: vendor.displayName, role: vendor.displayRole, experience: vendor.experienceSummary, avatar: vendor.avatarUrl } : null),
    vendor: vendor ? presentVendorPublic(vendor) : null,
    curatedPackages: packages.map(presentCuratedPackage),
    reviews: reviews.map((r) => presentReview(r)),
  };
}

/** "Near me": rectangular pre-filter in MongoDB, exact great-circle distance + sort in memory. */
export async function nearbyProperties(input: { lat: number; lng: number; radiusKm: number; limit: number }) {
  const box = boundingBox(input.lat, input.lng, input.radiusKm);
  const rows = await prisma.property.findMany({
    where: {
      status: 'active',
      address: { is: { lat: { gte: box.minLat, lte: box.maxLat }, lng: { gte: box.minLng, lte: box.maxLng } } },
    },
    take: 300,
  });
  return rows
    .map((p) => ({ p, km: haversineKm(input.lat, input.lng, p.address.lat, p.address.lng) }))
    .filter((r) => r.km <= input.radiusKm)
    .sort((a, b) => a.km - b.km)
    .slice(0, input.limit)
    .map(({ p, km }) => presentPropertyCard(p, { distanceKm: Math.round(km * 10) / 10 }));
}

/* ───────────────────────────── vendor writes ───────────────────────────── */

export async function createProperty(vendorId: string, input: CreatePropertyInput) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw ApiError.notFound('Vendor');
  const d = derive(input.rooms);
  const slug = await uniqueSlug(input.name, async (s) => !!(await prisma.property.findUnique({ where: { slug: s }, select: { id: true } })));

  const created = await prisma.property.create({
    data: {
      slug,
      vendorId,
      name: input.name,
      propertyType: input.propertyType,
      tagline: input.tagline,
      badge: input.badge,
      tags: input.tags,
      amenityKeys: amenityKeysOf(input.amenities),
      description: input.description,
      longDescription: input.longDescription,
      location: input.location,
      locationId: input.locationId,
      city: input.city,
      country: input.country,
      address: input.address,
      images: normalizeImages(input.images),
      gallery: input.gallery,
      videos: input.videos,
      host: input.host ?? { name: vendor.displayName, role: vendor.displayRole, experience: vendor.experienceSummary ?? undefined, avatar: vendor.avatarUrl ?? undefined },
      highlights: input.highlights,
      amenities: input.amenities,
      policies: policiesSchema.parse(input.policies ?? {}),
      rooms: d.rooms,
      attractions: input.attractions,
      numericPrice: d.numericPrice,
      originalPrice: d.originalPrice,
      ratingBreakdown: { cleanliness: 0, accuracy: 0, communication: 0, location: 0, checkIn: 0, value: 0 },
      bgColor: input.bgColor,
      gradientOverlay: input.gradientOverlay,
      pricingRules: input.pricingRules ?? undefined,
      status: 'pending_approval',
    },
  });
  return presentProperty(created);
}

export async function updateProperty(vendorId: string, id: string, input: UpdatePropertyInput) {
  const row = await loadOwnedListing('property', vendorId, id);
  const status = statusAfterVendorEdit(row.status);
  const current = await prisma.property.findUniqueOrThrow({ where: { id } });

  const data: Prisma.PropertyUncheckedUpdateInput = { status };
  if (input.name !== undefined) data.name = input.name;
  if (input.propertyType !== undefined) data.propertyType = input.propertyType;
  if (input.tagline !== undefined) data.tagline = input.tagline;
  if (input.badge !== undefined) data.badge = input.badge;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.description !== undefined) data.description = input.description;
  if (input.longDescription !== undefined) data.longDescription = input.longDescription;
  if (input.location !== undefined) data.location = input.location;
  if (input.locationId !== undefined) data.locationId = input.locationId;
  if (input.city !== undefined) data.city = input.city;
  if (input.country !== undefined) data.country = input.country;
  if (input.address !== undefined) data.address = input.address;
  if (input.images !== undefined) data.images = normalizeImages(input.images);
  if (input.gallery !== undefined) data.gallery = input.gallery;
  if (input.videos !== undefined) data.videos = input.videos;
  if (input.host !== undefined) data.host = input.host;
  if (input.highlights !== undefined) data.highlights = input.highlights;
  if (input.attractions !== undefined) data.attractions = input.attractions;
  if (input.policies !== undefined) data.policies = policiesSchema.parse(input.policies);
  if (input.bgColor !== undefined) data.bgColor = input.bgColor;
  if (input.gradientOverlay !== undefined) data.gradientOverlay = input.gradientOverlay;
  if (input.pricingRules !== undefined) data.pricingRules = input.pricingRules;
  if (input.amenities !== undefined) {
    data.amenities = input.amenities;
    data.amenityKeys = amenityKeysOf(input.amenities);
  }
  if (input.rooms !== undefined) {
    const d = derive(input.rooms);
    await assertRoomsRemovable(id, current.rooms.map((r) => r.roomId), d.rooms.map((r) => r.roomId));
    data.rooms = d.rooms;
    data.numericPrice = d.numericPrice;
    data.originalPrice = d.originalPrice;
  }
  const updated = await prisma.property.update({ where: { id }, data });
  return presentProperty(updated);
}

/** A room that still has upcoming bookings cannot be removed. */
async function assertRoomsRemovable(propertyId: string, before: string[], after: string[]) {
  const removed = before.filter((r) => !after.includes(r));
  if (removed.length === 0) return;
  const blocking = await prisma.stayBooking.count({
    where: { propertyId, roomId: { in: removed }, bookingStatus: { in: ['pending', 'confirmed', 'checked_in'] }, checkOutDate: { gte: todayIST() } },
  });
  if (blocking > 0) {
    throw ApiError.conflict('A room you removed still has upcoming bookings. Cancel those bookings first.', 'ROOM_HAS_BOOKINGS', { removedRooms: removed });
  }
}

export async function listVendorProperties(vendorId: string, q: PaginationInput & { status?: Property['status']; q?: string }) {
  const where: Prisma.PropertyWhereInput = {
    vendorId,
    status: q.status ?? { not: 'archived' },
    ...(q.q ? { name: { contains: q.q, mode: 'insensitive' } } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({ where, orderBy: { updatedAt: 'desc' }, ...skipTake(q) }),
  ]);
  return { items: rows.map((p) => presentPropertyCard(p, { rejectionReason: p.rejectionReason, roomsCount: p.rooms.length })), meta: pageMeta(q, total) };
}

export async function getVendorProperty(vendorId: string, id: string) {
  await loadOwnedListing('property', vendorId, id);
  return presentProperty(await prisma.property.findUniqueOrThrow({ where: { id } }));
}

/** Staff view of any property regardless of status. */
export async function getPropertyForStaff(id: string) {
  const p = await prisma.property.findUnique({ where: { id } });
  if (!p) throw ApiError.notFound('Property');
  return { ...presentProperty(p), vendorId: p.vendorId, rejectionReason: p.rejectionReason, approvedAt: p.approvedAt };
}

