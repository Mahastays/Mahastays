import { Router } from 'express';
import { z } from 'zod';
import { requireVendor } from '../../middlewares/vendor';
import { ok } from '../../utils/apiResponse';
import { bodyOf, objectId, trimmed } from '../../utils/zod';
import { cancelBooking } from './booking.cancel.service';
import { experienceAction, packageAction, redeemVoucher, stayAction } from './booking.lifecycle.service';
import { getVendorBooking, listVendorBookings } from './booking.query.service';
import { bookingKindParam, experienceActionSchema, packageActionSchema, stayActionSchema, vendorBookingQuery } from './booking.schemas';

/** Vendor portal — /api/v1/vendor/bookings */
export const vendorBookingRouter = Router();

vendorBookingRouter.get('/', requireVendor(), async (req, res) => {
  const { items, meta } = await listVendorBookings(req.vendor!.id, vendorBookingQuery.parse(req.query));
  ok(res, items, meta);
});

vendorBookingRouter.get('/:type/:id', requireVendor(), async (req, res) => {
  ok(res, await getVendorBooking(req.vendor!.id, bookingKindParam.parse(req.params.type), objectId.parse(req.params.id)));
});

/** Front-desk actions: check in / check out / no-show (stays), complete (packages), check in / complete / no-show (activities). */
vendorBookingRouter.patch('/stays/:id/status', requireVendor(), async (req, res) => {
  ok(res, await stayAction(req.vendor!.id, objectId.parse(req.params.id), stayActionSchema.parse(bodyOf(req)).action));
});

vendorBookingRouter.patch('/packages/:id/status', requireVendor(), async (req, res) => {
  ok(res, await packageAction(req.vendor!.id, objectId.parse(req.params.id), packageActionSchema.parse(bodyOf(req)).action));
});

vendorBookingRouter.patch('/experiences/:id/status', requireVendor(), async (req, res) => {
  ok(res, await experienceAction(req.vendor!.id, objectId.parse(req.params.id), experienceActionSchema.parse(bodyOf(req)).action));
});

/** Vendor-initiated cancellation (overbooking, weather, ...) always refunds the customer in full. */
vendorBookingRouter.post('/:type/:id/cancel', requireVendor(), async (req, res) => {
  const { reason } = z.object({ reason: trimmed(3, 300) }).parse(bodyOf(req));
  ok(res, await cancelBooking(bookingKindParam.parse(req.params.type), objectId.parse(req.params.id), { role: 'vendor', id: req.vendor!.id }, { reason }, req));
});

/** Operator scans a complimentary-activity voucher from a package booking. */
vendorBookingRouter.post('/package/:id/passes/:code/redeem', requireVendor(), async (req, res) => {
  const code = Array.isArray(req.params.code) ? req.params.code[0] : String(req.params.code);
  ok(res, await redeemVoucher(req.vendor!.id, code));
});



