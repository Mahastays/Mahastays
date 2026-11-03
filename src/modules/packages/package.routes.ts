import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { requireApprovedVendor, requireVendor } from '../../middlewares/vendor';
import { created, ok } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { todayIST } from '../../utils/dates';
import { bodyOf, objectId } from '../../utils/zod';
import { mountVendorLifecycle } from '../catalog/listing.routes';
import { vendorListQuery } from '../properties/property.schemas';
import { createPackageSchema, listPackagesQuery, updatePackageSchema } from './package.schemas';
import { createPackage, getPackagePublic, getVendorPackage, listPackages, listVendorPackages, updatePackage } from './package.service';

/** Public catalog — GET /api/v1/packages */
export const publicPackageRouter = Router();

publicPackageRouter.get('/', async (req, res) => {
  const { items, meta } = await listPackages(listPackagesQuery.parse(req.query));
  ok(res, items, meta);
});

publicPackageRouter.get('/:idOrSlug/availability', async (req, res) => {
  const { startDate } = z.object({ startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(req.query);

  const pkg = await prisma.package.findFirst({
    where: {
      OR: [
        { id: /^[a-f0-9]{24}$/i.test(req.params.idOrSlug) ? req.params.idOrSlug : undefined },
        { slug: req.params.idOrSlug },
        { code: req.params.idOrSlug },
      ],
      status: 'active',
    },
  });
  if (!pkg) throw ApiError.notFound('Package');

  const used = await prisma.packageBooking.count({
    where: {
      packageId: pkg.id,
      startDate: { lte: startDate },
      endDate: { gte: startDate },
      bookingStatus: { not: 'cancelled' },
    },
  });

  const dailyCapacity = pkg.dailyCapacity ?? 10;
  const inWindow = (!pkg.validFrom || startDate >= pkg.validFrom) && (!pkg.validTill || startDate <= pkg.validTill) && startDate >= todayIST();
  ok(res, {
    packageId: pkg.slug,
    startDate,
    isAvailable: inWindow && used < dailyCapacity,
    remainingSlots: inWindow ? Math.max(0, dailyCapacity - used) : 0,
  });
});

publicPackageRouter.get('/:idOrSlug', async (req, res) => {
  ok(res, await getPackagePublic(String(req.params.idOrSlug)));
});

/** Vendor portal — /api/v1/vendor/packages */
export const vendorPackageRouter = Router();

vendorPackageRouter.get('/', requireVendor(), async (req, res) => {
  const { items, meta } = await listVendorPackages(req.vendor!.id, vendorListQuery.parse(req.query));
  ok(res, items, meta);
});

vendorPackageRouter.post('/', requireApprovedVendor(), async (req, res) => {
  created(res, await createPackage(req.vendor!.id, createPackageSchema.parse(bodyOf(req))));
});

vendorPackageRouter.get('/:id', requireVendor(), async (req, res) => {
  ok(res, await getVendorPackage(req.vendor!.id, objectId.parse(req.params.id)));
});

vendorPackageRouter.put('/:id', requireApprovedVendor(), async (req, res) => {
  ok(res, await updatePackage(req.vendor!.id, objectId.parse(req.params.id), updatePackageSchema.parse(bodyOf(req))));
});

mountVendorLifecycle(vendorPackageRouter, 'package');
