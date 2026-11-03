import { z } from 'zod';
import { ServiceableLocation } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from './logger';
import { ApiError } from '../utils/ApiError';

export interface ServiceableLocationItem {
  order: number;
  code: ServiceableLocation;
  slug: string;
  name: string;
  city: 'Mahabaleshwar' | 'Panchgani';
  aliases: string[];
  lat: number;
  lng: number;
  description: string;
}

/**
 * The 14 exclusive approved serviceable locations for Mahastays
 */
export const SERVICEABLE_LOCATIONS: readonly ServiceableLocationItem[] = [
  {
    order: 1,
    code: 'main_market_mahabaleshwar',
    slug: 'loc-main-market',
    name: 'Main Market, Mahabaleshwar',
    city: 'Mahabaleshwar',
    aliases: [
      'main market',
      'main market, mahabaleshwar',
      'main market mahabaleshwar',
      'mahabaleshwar market',
      'loc-main-market',
      'loc-main-market-mahabaleshwar',
    ],
    lat: 17.9237,
    lng: 73.6586,
    description: 'Heart of Mahabaleshwar town with bustling bazaars, chana & chikki shops, and central amenities.',
  },
  {
    order: 2,
    code: 'venna_lake',
    slug: 'loc-venna-lake',
    name: 'Venna Lake',
    city: 'Mahabaleshwar',
    aliases: [
      'venna lake',
      'venna lake road',
      'venna lake, mahabaleshwar',
      'venna lake road, mahabaleshwar',
      'loc-venna-lake',
    ],
    lat: 17.9258,
    lng: 73.665,
    description: 'Scenic 28-acre lake famous for boating, horse riding, lakeside food stalls, and misty hill views.',
  },
  {
    order: 3,
    code: 'panchgani_mahabaleshwar_road',
    slug: 'loc-panchgani-mahabaleshwar-road',
    name: 'Panchgani–Mahabaleshwar Road',
    city: 'Mahabaleshwar',
    aliases: [
      'panchgani-mahabaleshwar road',
      'panchgani–mahabaleshwar road',
      'panchgani mahabaleshwar road',
      'panchgani to mahabaleshwar road',
      'loc-panchgani-mahabaleshwar-road',
    ],
    lat: 17.928,
    lng: 73.74,
    description: 'The scenic ridge highway connecting Panchgani and Mahabaleshwar dotted with luxury resorts and valley lookouts.',
  },
  {
    order: 4,
    code: 'lingmala',
    slug: 'loc-lingmala',
    name: 'Lingmala',
    city: 'Mahabaleshwar',
    aliases: [
      'lingmala',
      'lingmala waterfall',
      'lingmala road',
      'lingmala, mahabaleshwar',
      'loc-lingmala',
    ],
    lat: 17.9304,
    lng: 73.6931,
    description: 'Lush green zone home to the breathtaking Lingmala waterfalls and serene forest estates.',
  },
  {
    order: 5,
    code: 'metgutad',
    slug: 'loc-metgutad',
    name: 'Metgutad',
    city: 'Mahabaleshwar',
    aliases: [
      'metgutad',
      'metgutad village',
      'metgutad road',
      'metgutad, mahabaleshwar',
      'loc-metgutad',
    ],
    lat: 17.9333,
    lng: 73.715,
    description: 'Peaceful village hamlet surrounded by strawberry farms and panoramic mountain vistas.',
  },
  {
    order: 6,
    code: 'mapro_garden',
    slug: 'loc-mapro-garden',
    name: 'Mapro Garden',
    city: 'Mahabaleshwar',
    aliases: [
      'mapro garden',
      'mapro garden road',
      'mapro garden, mahabaleshwar',
      'gureghar',
      'loc-mapro-garden',
    ],
    lat: 17.9315,
    lng: 73.7375,
    description: 'Iconic strawberry destination at Gureghar featuring retail, food, fruit orchards, and year-round festivities.',
  },
  {
    order: 7,
    code: 'old_mahabaleshwar',
    slug: 'loc-old-mahabaleshwar',
    name: 'Old Mahabaleshwar',
    city: 'Mahabaleshwar',
    aliases: [
      'old mahabaleshwar',
      'old mahabaleshwar road',
      'kshetra mahabaleshwar',
      'loc-old-mahabaleshwar',
    ],
    lat: 17.9576,
    lng: 73.6644,
    description: 'Historic spiritual hub featuring Panchganga and Mahabaleshwar temples, near Arthur Seat point.',
  },
  {
    order: 8,
    code: 'tapola_road',
    slug: 'loc-tapola-road',
    name: 'Tapola Road',
    city: 'Mahabaleshwar',
    aliases: [
      'tapola road',
      'tapola',
      'tapola road, mahabaleshwar',
      'loc-tapola-road',
    ],
    lat: 17.85,
    lng: 73.7,
    description: 'Scenic winding route descending towards the Shivsagar Lake backwaters, known as Mini Kashmir.',
  },
  {
    order: 9,
    code: 'medha_road',
    slug: 'loc-medha-road',
    name: 'Medha Road',
    city: 'Mahabaleshwar',
    aliases: [
      'medha road',
      'medha ghat',
      'medha road, mahabaleshwar',
      'loc-medha-road',
    ],
    lat: 17.88,
    lng: 73.78,
    description: 'Tranquil valley road offering secluded homestays, nature retreats, and sunrise views.',
  },
  {
    order: 10,
    code: 'bhilar',
    slug: 'loc-bhilar',
    name: 'Bhilar',
    city: 'Panchgani',
    aliases: [
      'bhilar',
      'bhilar village',
      'bhilar, panchgani',
      'village of books',
      'pustakanche gaav',
      'loc-bhilar',
    ],
    lat: 17.915,
    lng: 73.775,
    description: 'India’s first official "Village of Books" (Pustakanche Gaav), surrounded by heritage strawberry cultivation.',
  },
  {
    order: 11,
    code: 'panchgani',
    slug: 'loc-panchgani',
    name: 'Panchgani',
    city: 'Panchgani',
    aliases: [
      'panchgani',
      'panchgani town',
      'table land',
      'table land road, panchgani',
      'loc-panchgani',
    ],
    lat: 17.9237,
    lng: 73.8016,
    description: 'Picturesque hill station celebrated for Table Land, Sydney Point, boarding schools, and colonial architecture.',
  },
  {
    order: 12,
    code: 'avkali',
    slug: 'loc-avkali',
    name: 'Avkali',
    city: 'Mahabaleshwar',
    aliases: [
      'avkali',
      'avkali village',
      'avkali road',
      'avkali, mahabaleshwar',
      'loc-avkali',
    ],
    lat: 17.942,
    lng: 73.675,
    description: 'Charming rural valley settlement offering untouched Sahyadri nature, organic farming, and quiet stays.',
  },
  {
    order: 13,
    code: 'bhoise',
    slug: 'loc-bhoise',
    name: 'Bhoise',
    city: 'Mahabaleshwar',
    aliases: [
      'bhoise',
      'bhoise village',
      'bhoise, mahabaleshwar',
      'loc-bhoise',
    ],
    lat: 17.918,
    lng: 73.645,
    description: 'Picturesque agrarian pocket nestled amidst high plateau hills and strawberry plantations.',
  },
  {
    order: 14,
    code: 'mahabaleshwar_pratapgarh_fort_road',
    slug: 'loc-pratapgarh-fort-road',
    name: 'Mahabaleshwar Pratapgarh Fort Road',
    city: 'Mahabaleshwar',
    aliases: [
      'mahableswar pratapgarh fort road',
      'mahabaleshwar pratapgarh fort road',
      'pratapgarh fort road',
      'pratapgad fort road',
      'pratapgad road',
      'pratapgarh road',
      'loc-pratapgarh-fort-road',
      'loc-mahabaleshwar-pratapgarh-fort-road',
    ],
    lat: 17.934,
    lng: 73.585,
    description: 'Historic cliffside route leading to the iconic 17th-century Pratapgad Fort of Chhatrapati Shivaji Maharaj.',
  },
] as const;

export const SERVICEABLE_LOCATION_CODES = SERVICEABLE_LOCATIONS.map((l) => l.code) as [
  ServiceableLocation,
  ...ServiceableLocation[],
];

export const serviceableLocationCodeSchema = z.enum(SERVICEABLE_LOCATION_CODES);

/**
 * Normalizes an arbitrary search or input string for fuzzy location matching.
 */
function clean(str: string): string {
  return str
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Resolves any representation (code, slug, name, alias, or substring)
 * to one of the 14 official serviceable locations.
 */
export function resolveServiceableLocation(input?: string | null): ServiceableLocationItem | null {
  if (!input) return null;
  const raw = input.trim().toLowerCase();
  const norm = clean(input);
  if (!norm) return null;

  // 1. Exact match pass across all 14 locations
  for (const loc of SERVICEABLE_LOCATIONS) {
    if (loc.code.toLowerCase() === raw) return loc;
    if (loc.slug.toLowerCase() === raw) return loc;
    if (loc.name.toLowerCase() === raw) return loc;

    if (clean(loc.code) === norm) return loc;
    if (clean(loc.slug) === norm) return loc;
    if (clean(loc.name) === norm) return loc;

    for (const alias of loc.aliases) {
      if (clean(alias) === norm) return loc;
    }
  }

  // 2. Partial substring match pass (only when exact match not found)
  for (const loc of SERVICEABLE_LOCATIONS) {
    for (const alias of loc.aliases) {
      if (norm.includes(clean(alias)) || clean(alias).includes(norm)) return loc;
    }
  }

  // 3. Fallback substring checks for compound descriptions
  for (const loc of SERVICEABLE_LOCATIONS) {
    const locClean = clean(loc.name);
    if (norm.includes(locClean) || locClean.includes(norm)) {
      return loc;
    }
  }

  return null;
}

/**
 * Validates that an incoming location belongs to the 14 approved serviceable locations.
 * If valid, returns normalized metadata. Otherwise throws an ApiError with allowable options.
 */
export function validateOrResolveLocation(
  locationInput?: string | null,
  locationIdInput?: string | null,
  serviceableLocationInput?: ServiceableLocation | null,
): {
  serviceableLocation: ServiceableLocation;
  locationId: string;
  canonicalName: string;
  city: 'Mahabaleshwar' | 'Panchgani';
} {
  const resolved =
    (serviceableLocationInput ? SERVICEABLE_LOCATIONS.find((l) => l.code === serviceableLocationInput) : null) ||
    resolveServiceableLocation(locationIdInput) ||
    resolveServiceableLocation(locationInput);

  if (!resolved) {
    const list = SERVICEABLE_LOCATIONS.map((l, i) => `${i + 1}. ${l.name}`).join(', ');
    throw ApiError.badRequest(
      `Location is outside serviceable areas. Mahastays only operates in the following 14 locations: ${list}`,
    );
  }

  return {
    serviceableLocation: resolved.code,
    locationId: resolved.slug,
    canonicalName: resolved.name,
    city: resolved.city,
  };
}

/**
 * Idempotently seeds or refreshes the 14 serviceable locations in the MongoDB database
 */
export async function syncServiceableLocationsToDB(): Promise<void> {
  for (const loc of SERVICEABLE_LOCATIONS) {
    await prisma.serviceableArea.upsert({
      where: { code: loc.code },
      update: {
        slug: loc.slug,
        name: loc.name,
        city: loc.city,
        order: loc.order,
        description: loc.description,
        isActive: true,
      },
      create: {
        code: loc.code,
        slug: loc.slug,
        name: loc.name,
        city: loc.city,
        order: loc.order,
        description: loc.description,
        isActive: true,
      },
    });
  }
  logger.info('14 serviceable locations synchronized to database');
}
