import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import type { CreatePlaceInput, UpdatePlaceInput, PlaceListQuery } from './places.types';
import { SEED_FAMOUS_PLACES } from './places.seed';
import { logger } from '../../config/logger';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Ensure the default famous places exist in MongoDB.
 * If the collection is empty, automatically seed with the 12 iconic places!
 */
export async function seedFamousPlacesIfEmpty(): Promise<number> {
  try {
    const count = await prisma.place.count();
    if (count > 0) return count;

    logger.info('[places] Places collection is empty; seeding 12 authentic Mahabaleshwar places...');
    let seeded = 0;
    for (const item of SEED_FAMOUS_PLACES) {
      const slug = item.slug || slugify(item.name);
      await prisma.place.upsert({
        where: { slug },
        update: {},
        create: {
          name: item.name,
          slug,
          category: item.category,
          vicinity: item.vicinity,
          shortDescription: item.shortDescription,
          description: item.description,
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          altitude: item.altitude,
          images: item.images || [],
          coverImage: item.coverImage || item.images?.[0] || null,
          timings: item.timings,
          entryFee: item.entryFee,
          bestTimeToVisit: item.bestTimeToVisit,
          highlights: item.highlights || [],
          tips: item.tips || [],
          isFeatured: item.isFeatured ?? false,
          order: item.order ?? 0,
          isActive: item.isActive ?? true,
        },
      });
      seeded++;
    }
    logger.info({ seeded }, '[places] Successfully seeded famous places');
    return seeded;
  } catch (err: any) {
    logger.error({ err: err?.message || err }, '[places] Failed to auto-seed places');
    return 0;
  }
}

export async function listPlaces(query: PlaceListQuery) {
  // Auto-seed if empty on first request
  await seedFamousPlacesIfEmpty();

  const where: any = {};

  if (query.activeOnly !== false) {
    where.isActive = true;
  }

  if (query.category && query.category !== 'all') {
    where.category = query.category.toLowerCase().trim();
  }

  if (query.vicinity && query.vicinity !== 'all') {
    where.vicinity = { contains: query.vicinity.trim(), mode: 'insensitive' };
  }

  if (query.featured) {
    where.isFeatured = true;
  }

  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { shortDescription: { contains: s, mode: 'insensitive' } },
      { category: { contains: s, mode: 'insensitive' } },
      { vicinity: { contains: s, mode: 'insensitive' } },
    ];
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.max(1, Math.min(100, query.limit || 24));
  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    prisma.place.count({ where }),
    prisma.place.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPlaceBySlug(slug: string) {
  await seedFamousPlacesIfEmpty();
  const place = await prisma.place.findUnique({
    where: { slug: slug.toLowerCase().trim() },
  });

  if (!place) {
    throw ApiError.notFound('Place not found');
  }

  return place;
}

export async function getPlaceById(id: string) {
  const place = await prisma.place.findUnique({
    where: { id },
  });

  if (!place) {
    throw ApiError.notFound('Place not found');
  }

  return place;
}

export async function createPlace(input: CreatePlaceInput) {
  const slug = input.slug ? slugify(input.slug) : slugify(input.name);

  const existing = await prisma.place.findUnique({ where: { slug } });
  if (existing) {
    throw ApiError.conflict('A place with this slug or name already exists', 'SLUG_EXISTS');
  }

  const place = await prisma.place.create({
    data: {
      name: input.name.trim(),
      slug,
      category: input.category.toLowerCase().trim(),
      vicinity: input.vicinity.trim(),
      shortDescription: input.shortDescription.trim(),
      description: input.description.trim(),
      address: input.address?.trim() || null,
      latitude: input.latitude,
      longitude: input.longitude,
      altitude: input.altitude?.trim() || null,
      images: input.images || [],
      coverImage: input.coverImage || input.images?.[0] || null,
      timings: input.timings?.trim() || null,
      entryFee: input.entryFee?.trim() || null,
      bestTimeToVisit: input.bestTimeToVisit?.trim() || null,
      highlights: input.highlights || [],
      tips: input.tips || [],
      isFeatured: input.isFeatured ?? false,
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
    },
  });

  return place;
}

export async function updatePlace(id: string, input: UpdatePlaceInput) {
  const place = await getPlaceById(id);

  let slug = place.slug;
  if (input.slug && input.slug !== place.slug) {
    slug = slugify(input.slug);
    const existing = await prisma.place.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
      throw ApiError.conflict('A place with this slug already exists', 'SLUG_EXISTS');
    }
  }

  const updated = await prisma.place.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      slug,
      ...(input.category ? { category: input.category.toLowerCase().trim() } : {}),
      ...(input.vicinity ? { vicinity: input.vicinity.trim() } : {}),
      ...(input.shortDescription ? { shortDescription: input.shortDescription.trim() } : {}),
      ...(input.description ? { description: input.description.trim() } : {}),
      ...(input.address !== undefined ? { address: input.address?.trim() || null } : {}),
      ...(typeof input.latitude === 'number' ? { latitude: input.latitude } : {}),
      ...(typeof input.longitude === 'number' ? { longitude: input.longitude } : {}),
      ...(input.altitude !== undefined ? { altitude: input.altitude?.trim() || null } : {}),
      ...(input.images ? { images: input.images } : {}),
      ...(input.coverImage !== undefined ? { coverImage: input.coverImage || null } : {}),
      ...(input.timings !== undefined ? { timings: input.timings?.trim() || null } : {}),
      ...(input.entryFee !== undefined ? { entryFee: input.entryFee?.trim() || null } : {}),
      ...(input.bestTimeToVisit !== undefined ? { bestTimeToVisit: input.bestTimeToVisit?.trim() || null } : {}),
      ...(input.highlights ? { highlights: input.highlights } : {}),
      ...(input.tips ? { tips: input.tips } : {}),
      ...(typeof input.isFeatured === 'boolean' ? { isFeatured: input.isFeatured } : {}),
      ...(typeof input.order === 'number' ? { order: input.order } : {}),
      ...(typeof input.isActive === 'boolean' ? { isActive: input.isActive } : {}),
    },
  });

  return updated;
}

export async function deletePlace(id: string) {
  await getPlaceById(id);
  await prisma.place.delete({ where: { id } });
  return { deleted: true, id };
}

export async function togglePlaceFeatured(id: string) {
  const place = await getPlaceById(id);
  return prisma.place.update({
    where: { id },
    data: { isFeatured: !place.isFeatured },
  });
}

export async function togglePlaceStatus(id: string) {
  const place = await getPlaceById(id);
  return prisma.place.update({
    where: { id },
    data: { isActive: !place.isActive },
  });
}
