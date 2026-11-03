import type { Router } from 'express';
import { requireApprovedVendor } from '../../middlewares/vendor';
import { ok } from '../../utils/apiResponse';
import { bodyOf, objectId } from '../../utils/zod';
import { visibilitySchema } from '../properties/property.schemas';
import { z } from 'zod';
import { vendorArchive, vendorSetAcceptingBookings, vendorSetVisibility, type ListingKind } from './listing.service';

/** PATCH /:id/status (show / hide an approved listing) and DELETE /:id (archive) — identical for all three listing kinds. */
export function mountVendorLifecycle(router: Router, kind: ListingKind): void {
  router.patch('/:id/status', requireApprovedVendor(), async (req, res) => {
    const { status } = visibilitySchema.parse(bodyOf(req));
    ok(res, await vendorSetVisibility(kind, req.vendor!.id, objectId.parse(req.params.id), status));
  });
  router.patch('/:id/accepting-bookings', requireApprovedVendor(), async (req, res) => {
    const { acceptingBookings } = z.object({ acceptingBookings: z.boolean() }).parse(bodyOf(req));
    ok(res, await vendorSetAcceptingBookings(kind, req.vendor!.id, objectId.parse(req.params.id), acceptingBookings));
  });
  router.delete('/:id', requireApprovedVendor(), async (req, res) => {
    ok(res, await vendorArchive(kind, req.vendor!.id, objectId.parse(req.params.id)));
  });
}
