import { Router } from 'express';
import { requireApprovedVendor, requireVendor } from '../../middlewares/vendor';
import { created, ok } from '../../utils/apiResponse';
import { bodyOf, objectId } from '../../utils/zod';
import { mountVendorLifecycle } from '../catalog/listing.routes';
import { loadOwnedListing } from '../catalog/listing.service';
import { addExperienceBlock, listBlocks, removeBlock } from '../inventory/inventory.service';
import { nearbyQuery, vendorListQuery } from '../properties/property.schemas';
import { createExperienceSchema, experienceBlockSchema, listExperiencesQuery, slotsQuery, updateExperienceSchema, updateSlotsSchema } from './experience.schemas';
import {
  createExperience,
  getExperiencePublic,
  getSlotsForDate,
  getVendorExperience,
  listExperiences,
  listVendorExperiences,
  nearbyExperiences,
  updateExperience,
} from './experience.service';

/** Public catalog — GET /api/v1/experiences */
export const publicExperienceRouter = Router();

publicExperienceRouter.get('/', async (req, res) => {
  const { items, meta } = await listExperiences(listExperiencesQuery.parse(req.query));
  ok(res, items, meta);
});

publicExperienceRouter.get('/nearby', async (req, res) => {
  ok(res, await nearbyExperiences(nearbyQuery.parse(req.query)));
});

publicExperienceRouter.get('/:idOrSlug', async (req, res) => {
  ok(res, await getExperiencePublic(String(req.params.idOrSlug)));
});

/** Real-time slot availability for one date: GET /experiences/:id/slots?date=YYYY-MM-DD */
publicExperienceRouter.get('/:idOrSlug/slots', async (req, res) => {
  ok(res, await getSlotsForDate(String(req.params.idOrSlug), slotsQuery.parse(req.query).date));
});

/** Vendor portal — /api/v1/vendor/experiences */
export const vendorExperienceRouter = Router();

vendorExperienceRouter.get('/', requireVendor(), async (req, res) => {
  const { items, meta } = await listVendorExperiences(req.vendor!.id, vendorListQuery.parse(req.query));
  ok(res, items, meta);
});

vendorExperienceRouter.post('/', requireApprovedVendor(), async (req, res) => {
  const body: any = bodyOf(req);
  const targetVendorId = (req.auth && ['admin', 'super_admin', 'sub_admin'].includes(req.auth.role) && body.vendorId)
    ? body.vendorId
    : req.vendor!.id;
  created(res, await createExperience(targetVendorId, createExperienceSchema.parse(body)));
});

vendorExperienceRouter.get('/:id', requireVendor(), async (req, res) => {
  ok(res, await getVendorExperience(req.vendor!.id, objectId.parse(req.params.id)));
});

/** Spec: PUT /vendor/experiences/:id/slots — update slot capacities & schedule. Same as a partial update restricted to those fields. */
vendorExperienceRouter.put('/:id/slots', requireApprovedVendor(), async (req, res) => {
  const { slots, schedule } = updateSlotsSchema.parse(bodyOf(req));
  ok(res, await updateExperience(req.vendor!.id, objectId.parse(req.params.id), { slots, schedule }));
});

vendorExperienceRouter.put('/:id', requireApprovedVendor(), async (req, res) => {
  ok(res, await updateExperience(req.vendor!.id, objectId.parse(req.params.id), updateExperienceSchema.parse(bodyOf(req))));
});

mountVendorLifecycle(vendorExperienceRouter, 'experience');

/* Close a slot / a whole day (e.g. weather) */
vendorExperienceRouter.get('/:id/blocks', requireVendor(), async (req, res) => {
  const id = objectId.parse(req.params.id);
  await loadOwnedListing('experience', req.vendor!.id, id);
  ok(res, await listBlocks('experience', id));
});

vendorExperienceRouter.post('/:id/blocks', requireApprovedVendor(), async (req, res) => {
  const id = objectId.parse(req.params.id);
  await loadOwnedListing('experience', req.vendor!.id, id);
  created(res, await addExperienceBlock({ id: req.vendor!.id, role: 'vendor' }, id, experienceBlockSchema.parse(bodyOf(req))));
});

vendorExperienceRouter.delete('/:id/blocks/:blockId', requireApprovedVendor(), async (req, res) => {
  const id = objectId.parse(req.params.id);
  await loadOwnedListing('experience', req.vendor!.id, id);
  await removeBlock('experience', id, objectId.parse(req.params.blockId));
  ok(res, { deleted: true });
});
