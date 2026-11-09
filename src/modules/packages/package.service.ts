import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { pageMeta, skipTake, type PaginationInput } from '../../utils/pagination';
import { slugify, uniqueSlug, isObjectId } from '../../utils/slug';
import { loadOwnedListing, statusAfterVendorEdit } from '../catalog/listing.service';
import { presentReview } from '../reviews/review.presenter';
import { presentVendorPublic } from '../vendors/vendor.presenter';
import { presentPackage, presentPackageCard } from './package.presenter';
import type { CreatePackageInput, ListPackagesQuery, UpdatePackageInput } from './package.schemas';

const whereIdOrSlug = (idOrSlug: string): Prisma.PackageWhereInput =>
  isObjectId(idOrSlug)
    ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }, { code: idOrSlug }] }
    : { OR: [{ slug: idOrSlug }, { code: idOrSlug }] };

function orderByFor(sort: ListPackagesQuery['sort']): Prisma.PackageOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc':
      return [{ numericPrice: 'asc' }];
    case 'price_desc':
      return [{ numericPrice: 'desc' }];
    case 'rating':
      return [{ rating: 'desc' }, { reviewsCount: 'desc' }];
    case 'popular':
      return [{ totalBookings: 'desc' }, { reviewsCount: 'desc' }];
    case 'newest':
      return [{ createdAt: 'desc' }];
    default:
      return [{ featured: 'desc' }, { rating: 'desc' }, { totalBookings: 'desc' }];
  }
}

/** Stable tier ids ("couple-standard"); generated from the name when omitted. */
function normalizeTiers(tiers: CreatePackageInput['tiers']) {
  const used = new Set(tiers.map((t) => t.tierId).filter(Boolean) as string[]);
  return tiers.map((t) => {
    if (t.tierId) return { ...t, tierId: t.tierId };
    let id = slugify(t.name);
    for (let n = 2; used.has(id); n += 1) id = `${slugify(t.name)}-${n}`;
    used.add(id);
    return { ...t, tierId: id };
  });
}

function deriveFromTiers(tiers: { pricePerPerson: number; originalPrice?: number | null }[]) {
  const cheapest = tiers.reduce((a, b) => (b.pricePerPerson < a.pricePerPerson ? b : a));
  return { numericPrice: cheapest.pricePerPerson, originalPrice: cheapest.originalPrice ?? null };
}

/** Resolves free-activity references to snapshots (name / image / category / time). */
async function resolveFreeActivities(items: CreatePackageInput['freeActivities']) {
  if (items.length === 0) return [];
  const experiences = await prisma.experience.findMany({
    where: { id: { in: items.map((i) => i.experienceId) }, status: 'active' },
    select: { id: true, title: true, image: true, category: true },
  });
  const byId = new Map(experiences.map((e) => [e.id, e]));
  return items.map((i) => {
    const e = byId.get(i.experienceId);
    if (!e) throw ApiError.unprocessable(`Free activity ${i.experienceId} does not exist or is not active`, { experienceId: i.experienceId }, 'FREE_ACTIVITY_INVALID');
    return { experienceId: e.id, name: e.title, time: i.time, image: e.image ?? undefined, category: e.category };
  });
}

async function assertHostProperty(vendorId: string, propertyId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, vendorId: true, status: true } });
  if (!property || property.vendorId !== vendorId) throw ApiError.unprocessable('You can only host packages at your own properties', { propertyId }, 'HOST_PROPERTY_INVALID');
  if (property.status === 'blocked' || property.status === 'archived') throw ApiError.unprocessable('The host property is not available', { propertyId }, 'HOST_PROPERTY_INVALID');
}

/* ───────────────────────────── public reads ───────────────────────────── */

export async function listPackages(q: ListPackagesQuery) {
  const and: Prisma.PackageWhereInput[] = [{ status: 'active' }];
  if (q.q) {
    const contains = { contains: q.q, mode: 'insensitive' as const };
    and.push({ OR: [{ title: contains }, { city: contains }, { location: contains }, { shortDesc: contains }] });
  }
  if (q.destination) {
    const contains = { contains: q.destination, mode: 'insensitive' as const };
    and.push({ OR: [{ city: contains }, { location: contains }] });
  }
  if (q.category?.length) and.push({ category: { in: q.category } });
  if (q.packageType?.length) and.push({ packageType: { in: q.packageType } });
  if (q.propertyId) and.push({ propertyId: q.propertyId });
  if (q.minPrice !== undefined || q.maxPrice !== undefined) and.push({ numericPrice: { gte: q.minPrice, lte: q.maxPrice } });
  if (q.minRating !== undefined) and.push({ rating: { gte: q.minRating } });
  if (q.maxDays !== undefined) and.push({ durationDays: { lte: q.maxDays } });
  if (q.featured !== undefined) and.push({ featured: q.featured });
  const where: Prisma.PackageWhereInput = { AND: and };

  const [total, rows] = await Promise.all([
    prisma.package.count({ where }),
    prisma.package.findMany({ where, orderBy: orderByFor(q.sort), ...skipTake(q) }),
  ]);
  return { items: rows.map((p) => presentPackageCard(p)), meta: pageMeta(q, total) };
}

export async function getPackagePublic(idOrSlug: string) {
  const pk = await prisma.package.findFirst({ where: { ...whereIdOrSlug(idOrSlug), status: 'active' } });
  if (!pk) throw ApiError.notFound('Package');
  return buildPackageDetail(pk.id);
}

async function buildPackageDetail(id: string) {
  const pk = await prisma.package.findUniqueOrThrow({ where: { id } });
  const experienceIds = pk.freeActivities.map((a) => a.experienceId).filter((x): x is string => !!x);
  const [property, vendor, experiences, reviews] = await Promise.all([
    prisma.property.findUnique({ where: { id: pk.propertyId }, select: { id: true, name: true, propertyType: true, location: true, slug: true } }),
    prisma.vendor.findUnique({ where: { id: pk.vendorId }, select: { id: true, displayName: true, displayRole: true, experienceSummary: true, avatarUrl: true } }),
    experienceIds.length
      ? prisma.experience.findMany({ where: { id: { in: experienceIds } }, select: { id: true, title: true, image: true, category: true, status: true } })
      : Promise.resolve([]),
    prisma.review.findMany({ where: { targetType: 'package', targetId: pk.id, status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 6 }),
  ]);
  return {
    ...presentPackage(pk, { property, experiences: new Map(experiences.map((e) => [e.id, e])) }),
    vendor: vendor ? presentVendorPublic(vendor) : null,
    host: vendor
      ? {
          name: vendor.displayName,
          role: vendor.displayRole,
          experience: vendor.experienceSummary,
          avatar: vendor.avatarUrl ?? null,
          verified: true,
        }
      : null,
    reviews: reviews.map((r) => presentReview(r)),
  };
}

/* ───────────────────────────── vendor writes ───────────────────────────── */

export async function createPackage(vendorId: string, input: CreatePackageInput) {
  await assertHostProperty(vendorId, input.propertyId);
  const tiers = normalizeTiers(input.tiers);
  const derived = deriveFromTiers(tiers);
  const slug = await uniqueSlug(input.title, async (s) => !!(await prisma.package.findUnique({ where: { slug: s }, select: { id: true } })));

  const created = await prisma.package.create({
    data: {
      slug,
      vendorId,
      propertyId: input.propertyId,
      packageType: input.packageType,
      category: input.category,
      title: input.title,
      badge: input.badge,
      priceType: input.priceType ?? 'per_person',
      personLimit: input.personLimit ?? input.pricing?.maxGuests ?? null,
      durationDays: input.durationDays,
      durationNights: input.durationNights,
      location: input.location,
      locationId: input.locationId,
      city: input.city,
      country: input.country,
      numericPrice: derived.numericPrice,
      originalPrice: derived.originalPrice,
      shortDesc: input.shortDesc,
      description: input.description,
      overview: input.overview,
      thumbnail: input.thumbnail,
      images: input.images,
      freeActivities: await resolveFreeActivities(input.freeActivities),
      highlights: input.highlights,
      inclusions: input.inclusions,
      rawInclusions: input.rawInclusions as Prisma.InputJsonValue | undefined,
      exclusions: input.exclusions,
      itinerary: input.itinerary,
      tiers,
      pricing: { basePrice: derived.numericPrice, pricePerPerson: derived.numericPrice, ...input.pricing },
      validFrom: input.validFrom,
      validTill: input.validTill,
      cancellationPolicy: input.cancellationPolicy,
      pricingRules: input.pricingRules ?? null,
      status: 'pending_approval',
    },
  });
  return buildPackageDetail(created.id);
}

export async function updatePackage(vendorId: string, id: string, input: UpdatePackageInput) {
  const row = await loadOwnedListing('package', vendorId, id);
  const status = statusAfterVendorEdit(row.status);
  const current = await prisma.package.findUniqueOrThrow({ where: { id } });

  // Cross-field checks that need the stored values too
  const days = input.durationDays ?? current.durationDays;
  const nights = input.durationNights ?? current.durationNights;
  if (nights >= days) throw ApiError.unprocessable('durationNights must be less than durationDays', undefined, 'VALIDATION_ERROR');

  const data: Prisma.PackageUncheckedUpdateInput = { status };
  if (input.propertyId !== undefined) {
    await assertHostProperty(vendorId, input.propertyId);
    data.propertyId = input.propertyId;
  }
  if (input.packageType !== undefined) data.packageType = input.packageType;
  if (input.category !== undefined) data.category = input.category;
  if (input.title !== undefined) data.title = input.title;
  if (input.badge !== undefined) data.badge = input.badge;
  if (input.priceType !== undefined) data.priceType = input.priceType;
  if (input.personLimit !== undefined) data.personLimit = input.personLimit;
  if (input.durationDays !== undefined) data.durationDays = input.durationDays;
  if (input.durationNights !== undefined) data.durationNights = input.durationNights;
  if (input.location !== undefined) data.location = input.location;
  if (input.locationId !== undefined) data.locationId = input.locationId;
  if (input.city !== undefined) data.city = input.city;
  if (input.country !== undefined) data.country = input.country;
  if (input.shortDesc !== undefined) data.shortDesc = input.shortDesc;
  if (input.description !== undefined) data.description = input.description;
  if (input.overview !== undefined) data.overview = input.overview;
  if (input.thumbnail !== undefined) data.thumbnail = input.thumbnail;
  if (input.images !== undefined) data.images = input.images;
  if (input.freeActivities !== undefined) data.freeActivities = await resolveFreeActivities(input.freeActivities);
  if (input.highlights !== undefined) data.highlights = input.highlights;
  if (input.inclusions !== undefined) data.inclusions = input.inclusions;
  if (input.rawInclusions !== undefined) data.rawInclusions = input.rawInclusions as Prisma.InputJsonValue;
  if (input.exclusions !== undefined) data.exclusions = input.exclusions;
  if (input.itinerary !== undefined) data.itinerary = input.itinerary;
  if (input.validFrom !== undefined) data.validFrom = input.validFrom;
  if (input.validTill !== undefined) data.validTill = input.validTill;
  if (input.cancellationPolicy !== undefined) data.cancellationPolicy = input.cancellationPolicy;
  if (input.pricingRules !== undefined) data.pricingRules = input.pricingRules;

  let tierPrices: { pricePerPerson: number; originalPrice?: number | null }[] = current.tiers;
  if (input.tiers !== undefined) {
    const normalized = normalizeTiers(input.tiers);
    const removed = current.tiers.map((t) => t.tierId).filter((t) => !normalized.some((n) => n.tierId === t));
    if (removed.length) {
      const inUse = await prisma.packageBooking.count({ where: { packageId: id, tierId: { in: removed }, bookingStatus: { in: ['pending', 'confirmed'] } } });
      if (inUse > 0) throw ApiError.conflict('A tier you removed is used by upcoming bookings', 'TIER_HAS_BOOKINGS', { removedTiers: removed });
    }
    tierPrices = normalized;
    const d = deriveFromTiers(normalized);
    data.tiers = normalized;
    data.numericPrice = d.numericPrice;
    data.originalPrice = d.originalPrice;
  }
  if (input.pricing !== undefined || input.tiers !== undefined) {
    const base = { ...current.pricing, ...input.pricing };
    const d = deriveFromTiers(tierPrices);
    data.pricing = { ...base, basePrice: d.numericPrice, pricePerPerson: d.numericPrice };
    if (base.maxGuests < base.minGuests) throw ApiError.unprocessable('maxGuests must be ≥ minGuests', undefined, 'VALIDATION_ERROR');
  }

  await prisma.package.update({ where: { id }, data });
  return buildPackageDetail(id);
}

export async function listVendorPackages(vendorId: string, q: PaginationInput & { status?: Prisma.PackageWhereInput['status']; q?: string }) {
  const where: Prisma.PackageWhereInput = {
    vendorId,
    status: q.status ?? { not: 'archived' },
    ...(q.q ? { title: { contains: q.q, mode: 'insensitive' } } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.package.count({ where }),
    prisma.package.findMany({ where, orderBy: { updatedAt: 'desc' }, ...skipTake(q) }),
  ]);
  return { items: rows.map((p) => presentPackageCard(p, { rejectionReason: p.rejectionReason, totalBookings: p.totalBookings })), meta: pageMeta(q, total) };
}

export async function getVendorPackage(vendorId: string, id: string) {
  await loadOwnedListing('package', vendorId, id);
  return buildPackageDetail(id);
}

export async function getPackageForStaff(id: string) {
  const pk = await prisma.package.findUnique({ where: { id } });
  if (!pk) throw ApiError.notFound('Package');
  return { ...(await buildPackageDetail(id)), vendorId: pk.vendorId, rejectionReason: pk.rejectionReason, approvedAt: pk.approvedAt };
}
