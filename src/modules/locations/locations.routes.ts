import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { ok } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { requireStaff } from '../../middlewares/staff';
import {
  SERVICEABLE_LOCATIONS,
  resolveServiceableLocation,
  syncServiceableLocationsToDB,
} from '../../config/locations';

export const publicLocationsRouter = Router();
export const adminLocationsRouter = Router();

/**
 * GET /locations or /locations/serviceable
 * Returns the 14 exclusive approved serviceable locations in Mahabaleshwar and Panchgani.
 */
publicLocationsRouter.get(['/', '/serviceable'], async (_req, res) => {
  // Query DB first if synced, fallback to in-memory config
  const dbLocations = await prisma.serviceableArea.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  if (dbLocations.length > 0) {
    const data = dbLocations.map((d) => {
      const cfg = SERVICEABLE_LOCATIONS.find((l) => l.code === d.code);
      return {
        id: d.id,
        order: d.order,
        code: d.code,
        slug: d.slug,
        name: d.name,
        city: d.city,
        lat: cfg?.lat ?? null,
        lng: cfg?.lng ?? null,
        description: d.description ?? cfg?.description ?? '',
      };
    });
    return ok(res, data, { total: data.length });
  }

  // Fallback to in-memory definitions
  const data = SERVICEABLE_LOCATIONS.map((l) => ({
    order: l.order,
    code: l.code,
    slug: l.slug,
    name: l.name,
    city: l.city,
    lat: l.lat,
    lng: l.lng,
    description: l.description,
  }));
  ok(res, data, { total: data.length });
});

/**
 * GET /locations/:idOrSlug
 * Returns a specific serviceable location by code, slug, name, or alias.
 */
publicLocationsRouter.get('/:idOrSlug', async (req, res) => {
  const loc = resolveServiceableLocation(req.params.idOrSlug);
  if (!loc) throw ApiError.notFound('Location not found in serviceable areas');
  ok(res, loc);
});

/**
 * POST /admin/locations/sync
 * SuperAdmin/Admin endpoint to force sync the 14 locations into MongoDB.
 */
adminLocationsRouter.post('/sync', requireStaff({ admin: true }), async (_req, res) => {
  await syncServiceableLocationsToDB();
  const all = await prisma.serviceableArea.findMany({ orderBy: { order: 'asc' } });
  ok(res, all, { total: all.length, message: '14 serviceable locations synchronized successfully' });
});
