import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { randomToken } from '../../utils/crypto';
import { boundingBox, haversineKm } from '../../utils/geo';
import { pageMeta, skipTake, sliceItems, type PaginationInput } from '../../utils/pagination';
import { slugify, uniqueSlug, isObjectId } from '../../utils/slug';
import { loadOwnedListing, statusAfterVendorEdit } from '../catalog/listing.service';
import { experienceSlotAvailability } from '../inventory/inventory.service';
import { presentReview } from '../reviews/review.presenter';
import { presentVendorPublic } from '../vendors/vendor.presenter';
import { presentExperience, presentExperienceCard } from './experience.presenter';
import type { CreateExperienceInput, ListExperiencesQuery, UpdateExperienceInput } from './experience.schemas';

const MAX_DATE_CANDIDATES = 200;

const whereIdOrSlug = (idOrSlug: string): Prisma.ExperienceWhereInput =>
  isObjectId(idOrSlug)
    ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }, { code: idOrSlug }] }
    : { OR: [{ slug: idOrSlug }, { code: idOrSlug }] };

function orderByFor(sort: ListExperiencesQuery['sort']): Prisma.ExperienceOrderByWithRelationInput[] {
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

function normalizeSlots(slots: CreateExperienceInput['slots']) {
  const used = new Set(slots.map((s) => s.slotId).filter(Boolean) as string[]);
  return slots.map((s) => {
    if (s.slotId) return { ...s, slotId: s.slotId };
    let id = `slot-${slugify(s.label).slice(0, 24)}`;
    while (used.has(id)) id = `slot-${randomToken(3)}`;
    used.add(id);
    return { ...s, slotId: id };
  });
}

function normalizeTiers(tiers: CreateExperienceInput['tiers']) {
  const used = new Set(tiers.map((t) => t.tierId).filter(Boolean) as string[]);
  return tiers.map((t) => {
    if (t.tierId) return { ...t, tierId: t.tierId };
    let id = slugify(t.name);
    for (let n = 2; used.has(id); n += 1) id = `${slugify(t.name)}-${n}`;
    used.add(id);
    return { ...t, tierId: id };
  });
}

const deriveFromTiers = (tiers: { pricePerPerson: number; originalPrice?: number | null }[]) => {
  const cheapest = tiers.reduce((a, b) => (b.pricePerPerson < a.pricePerPerson ? b : a));
  return { numericPrice: cheapest.pricePerPerson, originalPrice: cheapest.originalPrice ?? null };
};

const defaultSchedule = { mode: 'fixed_slot' as const, daysAvailable: ['all'] };

/* ───────────────────────────── public reads ───────────────────────────── */

export async function listExperiences(q: ListExperiencesQuery) {
  const and: Prisma.ExperienceWhereInput[] = [{ status: 'active' }];
  if (q.q) {
    const contains = { contains: q.q, mode: 'insensitive' as const };
    and.push({ OR: [{ title: contains }, { city: contains }, { description: contains }, { category: contains }] });
  }
  if (q.destination) and.push({ city: { contains: q.destination, mode: 'insensitive' } });
  if (q.category?.length) and.push({ category: { in: q.category } });
  if (q.difficulty?.length) and.push({ difficulty: { in: q.difficulty } });
  if (q.minPrice !== undefined || q.maxPrice !== undefined) and.push({ numericPrice: { gte: q.minPrice, lte: q.maxPrice } });
  if (q.minRating !== undefined) and.push({ rating: { gte: q.minRating } });
  if (q.featured !== undefined) and.push({ featured: q.featured });
  const where: Prisma.ExperienceWhereInput = { AND: and };
  const orderBy = orderByFor(q.sort);

  if (!q.date) {
    const [total, rows] = await Promise.all([
      prisma.experience.count({ where }),
      prisma.experience.findMany({ where, orderBy, ...skipTake(q) }),
    ]);
    return { items: rows.map((e) => presentExperienceCard(e)), meta: pageMeta(q, total) };
  }

  // With a date → only activities that still have a slot with enough spots that day.
  const candidates = await prisma.experience.findMany({ where, orderBy, take: MAX_DATE_CANDIDATES });
  const date = q.date;
  const items: ReturnType<typeof presentExperienceCard>[] = [];
  for (const e of candidates) {
    const slots = await experienceSlotAvailability(e, date);
    const open = slots.filter((s) => s.availableSpots >= (q.participants ?? 1));
    if (open.length > 0) items.push(presentExperienceCard(e, { openSlots: open.length, spotsLeft: open.reduce((s, x) => s + x.availableSpots, 0) }));
  }
  return sliceItems(items, q);
}

export async function getExperiencePublic(idOrSlug: string) {
  const e = await prisma.experience.findFirst({ where: { ...whereIdOrSlug(idOrSlug), status: 'active' } });
  if (!e) throw ApiError.notFound('Experience');
  return buildExperienceDetail(e.id);
}

async function buildExperienceDetail(id: string) {
  const e = await prisma.experience.findUniqueOrThrow({ where: { id } });
  const [vendor, reviews] = await Promise.all([
    prisma.vendor.findUnique({ where: { id: e.vendorId }, select: { id: true, displayName: true, displayRole: true, experienceSummary: true, avatarUrl: true } }),
    prisma.review.findMany({ where: { targetType: 'experience', targetId: e.id, status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 6 }),
  ]);
  const guide = e.guide
    ? {
        ...e.guide,
        avatar: e.guide.avatar || vendor?.avatarUrl || null,
      }
    : vendor
    ? {
        name: vendor.displayName,
        role: vendor.displayRole,
        avatar: vendor.avatarUrl || null,
      }
    : null;

  return {
    ...presentExperience(e),
    guide: guide ?? undefined,
    vendor: vendor ? presentVendorPublic(vendor) : null,
    reviews: reviews.map((r) => presentReview(r)),
  };
}

export async function getSlotsForDate(idOrSlug: string, date: string) {
  const e = await prisma.experience.findFirst({ where: { ...whereIdOrSlug(idOrSlug), status: 'active' } });
  if (!e) throw ApiError.notFound('Experience');
  const slots = await experienceSlotAvailability(e, date);
  return { experienceId: e.id, date, slots };
}

export async function nearbyExperiences(input: { lat: number; lng: number; radiusKm: number; limit: number }) {
  const box = boundingBox(input.lat, input.lng, input.radiusKm);
  const rows = await prisma.experience.findMany({
    where: {
      status: 'active',
      coordinates: { is: { lat: { gte: box.minLat, lte: box.maxLat }, lng: { gte: box.minLng, lte: box.maxLng } } },
    },
    take: 300,
  });
  return rows
    .flatMap((e) => (e.coordinates ? [{ e, km: haversineKm(input.lat, input.lng, e.coordinates.lat, e.coordinates.lng) }] : []))
    .filter((r) => r.km <= input.radiusKm)
    .sort((a, b) => a.km - b.km)
    .slice(0, input.limit)
    .map(({ e, km }) => presentExperienceCard(e, { distanceKm: Math.round(km * 10) / 10 }));
}

/* ───────────────────────────── vendor writes ───────────────────────────── */

export async function createExperience(vendorId: string, input: CreateExperienceInput) {
  const tiers = normalizeTiers(input.tiers);
  const derived = deriveFromTiers(tiers);
  const slug = await uniqueSlug(input.title, async (s) => !!(await prisma.experience.findUnique({ where: { slug: s }, select: { id: true } })));
  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id: vendorId } });

  const created = await prisma.experience.create({
    data: {
      slug,
      vendorId,
      title: input.title,
      country: input.country,
      flag: input.flag,
      city: input.city,
      locationId: input.locationId,
      duration: input.duration,
      category: input.category,
      priceType: input.priceType ?? 'per_person',
      personLimit: input.personLimit ?? null,
      numericPrice: derived.numericPrice,
      originalPrice: derived.originalPrice,
      difficulty: input.difficulty,
      ageLimit: input.ageLimit,
      groupSize: input.groupSize,
      language: input.language,
      image: input.image,
      gallery: input.gallery,
      description: input.description,
      overview: input.overview,
      highlights: input.highlights,
      timeline: input.timeline,
      inclusions: input.inclusions,
      exclusions: input.exclusions,
      whatToBring: input.whatToBring,
      meetingPoint: input.meetingPoint,
      coordinates: input.coordinates,
      schedule: input.schedule ?? defaultSchedule,
      slots: normalizeSlots(input.slots),
      tiers,
      guide: input.guide ?? { name: vendor.displayName, role: vendor.displayRole, avatar: vendor.avatarUrl ?? undefined },
      cancellationPolicy: input.cancellationPolicy,
      pricingRules: input.pricingRules ?? null,
      status: 'pending_approval',
    },
  });
  return buildExperienceDetail(created.id);
}

export async function updateExperience(vendorId: string, id: string, input: UpdateExperienceInput) {
  const row = await loadOwnedListing('experience', vendorId, id);
  const status = statusAfterVendorEdit(row.status);
  const current = await prisma.experience.findUniqueOrThrow({ where: { id } });

  const data: Prisma.ExperienceUncheckedUpdateInput = { status };
  if (input.title !== undefined) data.title = input.title;
  if (input.country !== undefined) data.country = input.country;
  if (input.flag !== undefined) data.flag = input.flag;
  if (input.city !== undefined) data.city = input.city;
  if (input.locationId !== undefined) data.locationId = input.locationId;
  if (input.duration !== undefined) data.duration = input.duration;
  if (input.category !== undefined) data.category = input.category;
  if (input.priceType !== undefined) data.priceType = input.priceType;
  if (input.personLimit !== undefined) data.personLimit = input.personLimit;
  if (input.difficulty !== undefined) data.difficulty = input.difficulty;
  if (input.ageLimit !== undefined) data.ageLimit = input.ageLimit;
  if (input.groupSize !== undefined) data.groupSize = input.groupSize;
  if (input.language !== undefined) data.language = input.language;
  if (input.image !== undefined) data.image = input.image;
  if (input.gallery !== undefined) data.gallery = input.gallery;
  if (input.description !== undefined) data.description = input.description;
  if (input.overview !== undefined) data.overview = input.overview;
  if (input.highlights !== undefined) data.highlights = input.highlights;
  if (input.timeline !== undefined) data.timeline = input.timeline;
  if (input.inclusions !== undefined) data.inclusions = input.inclusions;
  if (input.exclusions !== undefined) data.exclusions = input.exclusions;
  if (input.whatToBring !== undefined) data.whatToBring = input.whatToBring;
  if (input.meetingPoint !== undefined) data.meetingPoint = input.meetingPoint;
  if (input.coordinates !== undefined) data.coordinates = input.coordinates;
  if (input.schedule !== undefined) data.schedule = input.schedule;
  if (input.guide !== undefined) data.guide = input.guide;
  if (input.cancellationPolicy !== undefined) data.cancellationPolicy = input.cancellationPolicy;
  if (input.pricingRules !== undefined) data.pricingRules = input.pricingRules;

  if (input.slots !== undefined) {
    const slots = normalizeSlots(input.slots);
    const removed = current.slots.map((s) => s.slotId).filter((sid) => !slots.some((n) => n.slotId === sid));
    if (removed.length) {
      const inUse = await prisma.experienceBooking.count({ where: { experienceId: id, slotId: { in: removed }, bookingStatus: { in: ['pending', 'reserved'] } } });
      if (inUse > 0) throw ApiError.conflict('A slot you removed has upcoming bookings', 'SLOT_HAS_BOOKINGS', { removedSlots: removed });
    }
    data.slots = slots;
  }
  if (input.tiers !== undefined) {
    const tiers = normalizeTiers(input.tiers);
    const removed = current.tiers.map((t) => t.tierId).filter((tid) => !tiers.some((n) => n.tierId === tid));
    if (removed.length) {
      const inUse = await prisma.experienceBooking.count({ where: { experienceId: id, tierId: { in: removed }, bookingStatus: { in: ['pending', 'reserved'] } } });
      if (inUse > 0) throw ApiError.conflict('A ticket tier you removed is used by upcoming bookings', 'TIER_HAS_BOOKINGS', { removedTiers: removed });
    }
    const d = deriveFromTiers(tiers);
    data.tiers = tiers;
    data.numericPrice = d.numericPrice;
    data.originalPrice = d.originalPrice;
  }

  await prisma.experience.update({ where: { id }, data });
  return buildExperienceDetail(id);
}

export async function listVendorExperiences(vendorId: string, q: PaginationInput & { status?: Prisma.ExperienceWhereInput['status']; q?: string }) {
  const where: Prisma.ExperienceWhereInput = {
    vendorId,
    status: q.status ?? { not: 'archived' },
    ...(q.q ? { title: { contains: q.q, mode: 'insensitive' } } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.experience.count({ where }),
    prisma.experience.findMany({ where, orderBy: { updatedAt: 'desc' }, ...skipTake(q) }),
  ]);
  return { items: rows.map((e) => presentExperienceCard(e, { rejectionReason: e.rejectionReason })), meta: pageMeta(q, total) };
}

export async function getVendorExperience(vendorId: string, id: string) {
  await loadOwnedListing('experience', vendorId, id);
  return buildExperienceDetail(id);
}

export async function getExperienceForStaff(id: string) {
  const e = await prisma.experience.findUnique({ where: { id } });
  if (!e) throw ApiError.notFound('Experience');
  return { ...(await buildExperienceDetail(id)), vendorId: e.vendorId, rejectionReason: e.rejectionReason, approvedAt: e.approvedAt };
}
