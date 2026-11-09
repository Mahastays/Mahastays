import { Router } from 'express';
import { ok, created, paginated } from '../../utils/apiResponse';
import { requireStaff } from '../../middlewares/staff';
import { bodyOf } from '../../utils/zod';
import { createPlaceSchema, updatePlaceSchema, placeQuerySchema } from './places.schemas';
import * as svc from './places.service';

export const publicPlacesRouter = Router();
export const adminPlacesRouter = Router();

/* ─────────────────────────── PUBLIC ROUTES ─────────────────────────── */

/**
 * GET /api/v1/places
 * List public places with filtering, search, and pagination.
 */
publicPlacesRouter.get('/', async (req, res) => {
  const query = placeQuerySchema.parse(req.query);
  const result = await svc.listPlaces({
    category: query.category,
    vicinity: query.vicinity,
    search: query.search,
    featured: query.featured === 'true' ? true : undefined,
    activeOnly: true,
    page: query.page,
    limit: query.limit,
  });

  paginated(res, result.items, result.meta);
});

/**
 * GET /api/v1/places/featured
 * Get featured landmarks for hero carousel / showcase.
 */
publicPlacesRouter.get('/featured', async (_req, res) => {
  const result = await svc.listPlaces({
    featured: true,
    activeOnly: true,
    limit: 12,
  });
  ok(res, result.items);
});

/**
 * GET /api/v1/places/:slug
 * Fetch place details by slug.
 */
publicPlacesRouter.get('/:slug', async (req, res) => {
  const slug = String(req.params.slug);
  const place = await svc.getPlaceBySlug(slug);
  ok(res, place);
});

/* ─────────────────────────── ADMIN ROUTES ─────────────────────────── */

/**
 * GET /api/v1/admin/places
 * List all places (including drafts and inactive).
 */
adminPlacesRouter.get('/', requireStaff({ admin: true, sub_admin: true }), async (req, res) => {
  const query = placeQuerySchema.parse(req.query);
  const result = await svc.listPlaces({
    category: query.category,
    vicinity: query.vicinity,
    search: query.search,
    featured: query.featured === 'true' ? true : undefined,
    activeOnly: false,
    page: query.page,
    limit: query.limit,
  });

  paginated(res, result.items, result.meta);
});

/**
 * GET /api/v1/admin/places/:id
 * Fetch place details by ID (for admin edit page).
 */
adminPlacesRouter.get('/:id', requireStaff({ admin: true, sub_admin: true }), async (req, res) => {
  const place = await svc.getPlaceById(String(req.params.id));
  ok(res, place);
});

/**
 * POST /api/v1/admin/places
 * Create a new place.
 */
adminPlacesRouter.post('/', requireStaff({ admin: true, sub_admin: true }), async (req, res) => {
  const input = createPlaceSchema.parse(bodyOf(req));
  const place = await svc.createPlace(input);
  created(res, place);
});

/**
 * POST /api/v1/admin/places/seed
 * Force re-seed / sync default places.
 */
adminPlacesRouter.post('/seed', requireStaff({ admin: true, sub_admin: true }), async (_req, res) => {
  const count = await svc.seedFamousPlacesIfEmpty();
  ok(res, { message: `Seeded ${count} places successfully`, count });
});

/**
 * PUT /api/v1/admin/places/:id
 * Update an existing place.
 */
adminPlacesRouter.put('/:id', requireStaff({ admin: true, sub_admin: true }), async (req, res) => {
  const input = updatePlaceSchema.parse(bodyOf(req));
  const updated = await svc.updatePlace(String(req.params.id), input);
  ok(res, updated);
});

/**
 * DELETE /api/v1/admin/places/:id
 * Delete a place.
 */
adminPlacesRouter.delete('/:id', requireStaff({ admin: true, sub_admin: true }), async (req, res) => {
  const result = await svc.deletePlace(String(req.params.id));
  ok(res, result);
});

/**
 * PATCH /api/v1/admin/places/:id/toggle-featured
 * Toggle featured flag.
 */
adminPlacesRouter.patch('/:id/toggle-featured', requireStaff({ admin: true, sub_admin: true }), async (req, res) => {
  const updated = await svc.togglePlaceFeatured(String(req.params.id));
  ok(res, updated);
});

/**
 * PATCH /api/v1/admin/places/:id/toggle-status
 * Toggle active/draft status.
 */
adminPlacesRouter.patch('/:id/toggle-status', requireStaff({ admin: true, sub_admin: true }), async (req, res) => {
  const updated = await svc.togglePlaceStatus(String(req.params.id));
  ok(res, updated);
});
