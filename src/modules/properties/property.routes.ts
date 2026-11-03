import { Router } from 'express';
import { z } from 'zod';
import { SERVICEABLE_LOCATIONS } from '../../config/locations';
import { prisma } from '../../lib/prisma';
import { requireApprovedVendor, requireVendor } from '../../middlewares/vendor';
import { created, ok } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { diffDays } from '../../utils/dates';
import { bodyOf, objectId } from '../../utils/zod';
import { mountVendorLifecycle } from '../catalog/listing.routes';
import { loadOwnedListing } from '../catalog/listing.service';
import { addStayBlock, getRoomAvailability, listBlocks, propertyCalendar, removeBlock } from '../inventory/inventory.service';
import {
  blockSchema,
  calendarQuery,
  createPropertySchema,
  listPropertiesQuery,
  nearbyQuery,
  propertyDetailQuery,
  updatePropertySchema,
  vendorListQuery,
} from './property.schemas';
import { createProperty, getPropertyPublic, getVendorProperty, listProperties, listVendorProperties, nearbyProperties, updateProperty } from './property.service';

/** Public catalog — GET /api/v1/properties */
export const publicPropertyRouter = Router();

publicPropertyRouter.get('/', async (req, res) => {
  const { items, meta } = await listProperties(listPropertiesQuery.parse(req.query));
  ok(res, items, meta);
});

publicPropertyRouter.get('/nearby', async (req, res) => {
  ok(res, await nearbyProperties(nearbyQuery.parse(req.query)));
});

publicPropertyRouter.get('/suggest', async (req, res) => {
  const q = String(req.query.q ?? req.query.destination ?? '').trim();
  if (!q || q.length < 2) return ok(res, []);
  const out: { label: string; type: 'city' | 'area' | 'property'; locationId?: string | null; slug?: string }[] = [];
  const seen = new Set<string>();

  for (const loc of SERVICEABLE_LOCATIONS) {
    if (loc.name.toLowerCase().includes(q.toLowerCase()) || loc.city.toLowerCase().includes(q.toLowerCase())) {
      if (!seen.has(loc.name)) {
        seen.add(loc.name);
        out.push({ label: loc.name, type: 'area', locationId: loc.slug });
      }
    }
  }

  const props = await prisma.property.findMany({
    where: {
      status: 'active',
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: 8,
    select: { name: true, city: true, slug: true, locationId: true },
  });

  for (const p of props) {
    if (!seen.has(p.name)) {
      seen.add(p.name);
      out.push({ label: p.name, type: 'property', locationId: p.locationId, slug: p.slug });
    }
  }

  ok(res, out.slice(0, 10));
});

publicPropertyRouter.get('/:idOrSlug/availability', async (req, res) => {
  const { checkIn, checkOut } = z.object({
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).parse(req.query);

  const prop = await prisma.property.findFirst({
    where: {
      OR: [
        { id: /^[a-f0-9]{24}$/i.test(req.params.idOrSlug) ? req.params.idOrSlug : undefined },
        { slug: req.params.idOrSlug },
        { code: req.params.idOrSlug },
      ],
      status: 'active',
    },
  });
  if (!prop) throw ApiError.notFound('Property');

  const nights = diffDays(checkIn, checkOut);
  if (nights < 1) throw ApiError.badRequest('checkOut must be after checkIn');

  const rooms = await Promise.all(
    prop.rooms.map(async (r: any) => {
      const a = await getRoomAvailability(prop, r.roomId, checkIn, checkOut);
      return {
        roomId: r.roomId,
        name: r.name,
        pricePerNight: r.pricePerNight,
        totalUnits: r.count,
        remainingUnits: a.availableUnits,
        isAvailable: a.availableUnits > 0,
      };
    })
  );

  ok(res, { propertyId: prop.slug, checkInDate: checkIn, checkOutDate: checkOut, nights, rooms });
});

publicPropertyRouter.get('/:idOrSlug', async (req, res) => {
  ok(res, await getPropertyPublic(String(req.params.idOrSlug), propertyDetailQuery.parse(req.query)));
});

/** Vendor portal — /api/v1/vendor/properties */
export const vendorPropertyRouter = Router();

vendorPropertyRouter.get('/', requireVendor(), async (req, res) => {
  const { items, meta } = await listVendorProperties(req.vendor!.id, vendorListQuery.parse(req.query));
  ok(res, items, meta);
});

vendorPropertyRouter.post('/', requireApprovedVendor(), async (req, res) => {
  created(res, await createProperty(req.vendor!.id, createPropertySchema.parse(bodyOf(req))));
});

vendorPropertyRouter.get('/:id', requireVendor(), async (req, res) => {
  ok(res, await getVendorProperty(req.vendor!.id, objectId.parse(req.params.id)));
});

vendorPropertyRouter.put('/:id', requireApprovedVendor(), async (req, res) => {
  ok(res, await updateProperty(req.vendor!.id, objectId.parse(req.params.id), updatePropertySchema.parse(bodyOf(req))));
});

mountVendorLifecycle(vendorPropertyRouter, 'property');

/* Room inventory: availability calendar + date blocks */
vendorPropertyRouter.get('/:id/calendar', requireVendor(), async (req, res) => {
  const id = objectId.parse(req.params.id);
  await loadOwnedListing('property', req.vendor!.id, id);
  const { from, to } = calendarQuery.parse(req.query);
  ok(res, await propertyCalendar(id, from, to));
});

vendorPropertyRouter.get('/:id/blocks', requireVendor(), async (req, res) => {
  const id = objectId.parse(req.params.id);
  await loadOwnedListing('property', req.vendor!.id, id);
  ok(res, await listBlocks('property', id));
});

vendorPropertyRouter.post('/:id/blocks', requireApprovedVendor(), async (req, res) => {
  const id = objectId.parse(req.params.id);
  await loadOwnedListing('property', req.vendor!.id, id);
  created(res, await addStayBlock({ id: req.vendor!.id, role: 'vendor' }, id, blockSchema.parse(bodyOf(req))));
});

vendorPropertyRouter.delete('/:id/blocks/:blockId', requireApprovedVendor(), async (req, res) => {
  const id = objectId.parse(req.params.id);
  await loadOwnedListing('property', req.vendor!.id, id);
  await removeBlock('property', id, objectId.parse(req.params.blockId));
  ok(res, { deleted: true });
});
