import type { Wishlist } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { isUniqueViolation } from '../../utils/prismaErrors';
import { presentExperienceCard } from '../experiences/experience.presenter';
import { presentPackageCard } from '../packages/package.presenter';
import { presentPropertyCard } from '../properties/property.presenter';

export type WishlistTarget = 'property' | 'package' | 'experience';

const FIELD = { property: 'savedProperties', package: 'savedPackages', experience: 'savedExperiences' } as const;

export async function getWishlist(userId: string) {
  const w = await prisma.wishlist.findUnique({ where: { userId } });
  const ids = { properties: w?.savedProperties ?? [], packages: w?.savedPackages ?? [], experiences: w?.savedExperiences ?? [] };
  const [properties, packages, experiences] = await Promise.all([
    ids.properties.length ? prisma.property.findMany({ where: { id: { in: ids.properties }, status: 'active' } }) : [],
    ids.packages.length ? prisma.package.findMany({ where: { id: { in: ids.packages }, status: 'active' } }) : [],
    ids.experiences.length ? prisma.experience.findMany({ where: { id: { in: ids.experiences }, status: 'active' } }) : [],
  ]);
  return {
    _id: w?.id ?? null,
    userId,
    savedProperties: ids.properties,
    savedPackages: ids.packages,
    savedExperiences: ids.experiences,
    items: {
      properties: properties.map((p) => presentPropertyCard(p)),
      packages: packages.map((p) => presentPackageCard(p)),
      experiences: experiences.map((e) => presentExperienceCard(e)),
    },
    updatedAt: w?.updatedAt ?? null,
  };
}

async function assertTargetExists(type: WishlistTarget, id: string) {
  const where = { id, status: 'active' as const };
  const select = { id: true } as const;
  const row =
    type === 'property' ? await prisma.property.findFirst({ where, select }) : type === 'package' ? await prisma.package.findFirst({ where, select }) : await prisma.experience.findFirst({ where, select });
  if (!row) throw ApiError.notFound('Item');
}

/** Adds the item if absent, removes it if present. */
export async function toggleWishlist(userId: string, type: WishlistTarget, targetId: string, attempt = 0): Promise<{ saved: boolean; type: WishlistTarget; targetId: string; totalSaved: number }> {
  const field = FIELD[type];
  const existing = await prisma.wishlist.findUnique({ where: { userId } });
  const current: string[] = existing ? existing[field] : [];
  const saved = !current.includes(targetId);
  if (saved) await assertTargetExists(type, targetId); // removing must always work, even if the listing was archived
  const next = saved ? [...current, targetId] : current.filter((x) => x !== targetId);

  try {
    const doc: Wishlist = await prisma.wishlist.upsert({
      where: { userId },
      create: { userId, [field]: next } as { userId: string },
      update: { [field]: { set: next } },
    });
    return { saved, type, targetId, totalSaved: doc.savedProperties.length + doc.savedPackages.length + doc.savedExperiences.length };
  } catch (err) {
    if (isUniqueViolation(err) && attempt < 1) return toggleWishlist(userId, type, targetId, attempt + 1); // two first-time taps raced
    throw err;
  }
}
