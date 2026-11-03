import { randomBytes } from 'crypto';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import type { HeroSlide } from './hero-slide.types';
import type { CreateHeroSlideInput, UpdateHeroSlideInput } from './hero-slide.schemas';

// Initial seed slides out of the box
const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-slide-1',
    _id: 'hero-slide-1',
    title: 'Unwind in Stunning Resorts,',
    subtitle: 'Stay in Elegant Hotels.',
    paragraph: 'Handpicked luxury villas, beachfront retreats, and mountain estates across Maharashtra at exclusive member rates.',
    image: '/hero-resort.jpg',
    badge: 'Curated Collection',
    ctaText: 'Explore Stays',
    ctaLink: '/explore',
    order: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'hero-slide-2',
    _id: 'hero-slide-2',
    title: 'Private Pool Villas &',
    subtitle: 'Serene Mountain Escapes.',
    paragraph: 'Escape the city rush. Enjoy infinity pool suites, bonfire nights, and breathtaking cliffside views.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&auto=format&fit=crop&q=80',
    badge: 'Boutique Living',
    ctaText: 'Discover Villas',
    ctaLink: '/explore',
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'hero-slide-3',
    _id: 'hero-slide-3',
    title: 'Immersive Experiences &',
    subtitle: 'Curated Holiday Packages.',
    paragraph: 'All-inclusive weekend stays crafted for couples, families, and celebrations with 100% verified hosts.',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1920&auto=format&fit=crop&q=80',
    badge: 'All Inclusive',
    ctaText: 'View Packages',
    ctaLink: '/packages',
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Memory cache for resilience
let memorySlides: HeroSlide[] = [...DEFAULT_HERO_SLIDES];
let hasInitializedDb = false;

function normalizeDoc(doc: any): HeroSlide {
  const rawId = doc._id?.$oid || doc._id || doc.id;
  return {
    id: String(rawId),
    _id: String(rawId),
    title: doc.title || '',
    subtitle: doc.subtitle || '',
    paragraph: doc.paragraph || '',
    image: doc.image || '',
    cloudinaryPublicId: doc.cloudinaryPublicId || undefined,
    badge: doc.badge || 'Featured',
    ctaText: doc.ctaText || 'Explore Stays',
    ctaLink: doc.ctaLink || '/explore',
    order: typeof doc.order === 'number' ? doc.order : 0,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt?.toISOString ? doc.createdAt.toISOString() : (doc.createdAt || new Date().toISOString()),
    updatedAt: doc.updatedAt?.toISOString ? doc.updatedAt.toISOString() : (doc.updatedAt || new Date().toISOString()),
  };
}

/**
 * Initialize MongoDB collection with default slides if empty.
 */
async function ensureDbInitialized() {
  if (hasInitializedDb) return;
  hasInitializedDb = true;

  try {
    const check = (await prisma.$runCommandRaw({
      find: 'hero_slides',
      limit: 1,
    })) as { cursor?: { firstBatch?: any[] } };

    if (!check?.cursor?.firstBatch || check.cursor.firstBatch.length === 0) {
      for (const slide of DEFAULT_HERO_SLIDES) {
        await prisma.$runCommandRaw({
          insert: 'hero_slides',
          documents: [
            {
              _id: slide.id,
              title: slide.title,
              subtitle: slide.subtitle,
              paragraph: slide.paragraph,
              image: slide.image,
              badge: slide.badge,
              ctaText: slide.ctaText,
              ctaLink: slide.ctaLink,
              order: slide.order,
              isActive: slide.isActive,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        });
      }
    }
  } catch {
    // If raw command fails (e.g. DB disconnected or replica initializing), memory cache remains ready
  }
}

/**
 * Get all hero slides.
 * @param activeOnly If true, returns only active slides sorted by order.
 */
export async function listHeroSlides(activeOnly = false): Promise<HeroSlide[]> {
  await ensureDbInitialized();

  try {
    const filter = activeOnly ? { isActive: true } : {};
    const res = (await prisma.$runCommandRaw({
      find: 'hero_slides',
      filter,
      sort: { order: 1, createdAt: -1 },
    })) as { cursor?: { firstBatch?: any[] } };

    if (res?.cursor?.firstBatch && res.cursor.firstBatch.length > 0) {
      const slides = res.cursor.firstBatch.map(normalizeDoc);
      slides.sort((a, b) => a.order - b.order);
      memorySlides = [...slides];
      return slides;
    }
  } catch {
    // Return memory cache on error
  }

  const result = activeOnly ? memorySlides.filter((s) => s.isActive) : [...memorySlides];
  return result.sort((a, b) => a.order - b.order);
}

/**
 * Get a single slide by ID.
 */
export async function getHeroSlideById(id: string): Promise<HeroSlide | null> {
  await ensureDbInitialized();

  try {
    const res = (await prisma.$runCommandRaw({
      find: 'hero_slides',
      filter: { _id: id },
      limit: 1,
    })) as { cursor?: { firstBatch?: any[] } };

    if (res?.cursor?.firstBatch?.[0]) {
      return normalizeDoc(res.cursor.firstBatch[0]);
    }
  } catch {
    // Fallback to memory
  }

  return memorySlides.find((s) => s.id === id) || null;
}

/**
 * Create a new hero slide.
 */
export async function createHeroSlide(input: CreateHeroSlideInput): Promise<HeroSlide> {
  await ensureDbInitialized();

  const id = `hero-${randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();

  const slide: HeroSlide = {
    id,
    _id: id,
    title: input.title,
    subtitle: input.subtitle || '',
    paragraph: input.paragraph || '',
    image: input.image,
    cloudinaryPublicId: input.cloudinaryPublicId,
    badge: input.badge || 'Curated Collection',
    ctaText: input.ctaText || 'Explore Stays',
    ctaLink: input.ctaLink || '/explore',
    order: input.order ?? memorySlides.length,
    isActive: input.isActive !== false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await prisma.$runCommandRaw({
      insert: 'hero_slides',
      documents: [
        {
          _id: id,
          title: slide.title,
          subtitle: slide.subtitle,
          paragraph: slide.paragraph,
          image: slide.image,
          cloudinaryPublicId: slide.cloudinaryPublicId,
          badge: slide.badge,
          ctaText: slide.ctaText,
          ctaLink: slide.ctaLink,
          order: slide.order,
          isActive: slide.isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
  } catch {
    // If DB command fails, memory store preserves state
  }

  memorySlides.push(slide);
  return slide;
}

/**
 * Update an existing hero slide.
 */
export async function updateHeroSlide(id: string, input: UpdateHeroSlideInput): Promise<HeroSlide> {
  await ensureDbInitialized();

  const existing = await getHeroSlideById(id);
  if (!existing) {
    throw ApiError.notFound('Hero slide not found');
  }

  const updated: HeroSlide = {
    ...existing,
    ...input,
    id,
    _id: id,
    updatedAt: new Date().toISOString(),
  };

  try {
    await prisma.$runCommandRaw({
      update: 'hero_slides',
      updates: [
        {
          q: { _id: id },
          u: {
            $set: {
              title: updated.title,
              subtitle: updated.subtitle,
              paragraph: updated.paragraph,
              image: updated.image,
              cloudinaryPublicId: updated.cloudinaryPublicId,
              badge: updated.badge,
              ctaText: updated.ctaText,
              ctaLink: updated.ctaLink,
              order: updated.order,
              isActive: updated.isActive,
              updatedAt: new Date(),
            },
          },
        },
      ],
    });
  } catch {
    // Handled in memory fallback
  }

  const idx = memorySlides.findIndex((s) => s.id === id);
  if (idx !== -1) {
    memorySlides[idx] = updated;
  } else {
    memorySlides.push(updated);
  }

  return updated;
}

/**
 * Set active state of a hero slide.
 */
export async function setHeroSlideActive(id: string, isActive: boolean): Promise<HeroSlide> {
  return updateHeroSlide(id, { isActive });
}

/**
 * Delete a hero slide.
 */
export async function deleteHeroSlide(id: string): Promise<boolean> {
  await ensureDbInitialized();

  try {
    await prisma.$runCommandRaw({
      delete: 'hero_slides',
      deletes: [
        {
          q: { _id: id },
          limit: 1,
        },
      ],
    });
  } catch {
    // Handled in memory
  }

  const initialLength = memorySlides.length;
  memorySlides = memorySlides.filter((s) => s.id !== id);
  return memorySlides.length < initialLength;
}

