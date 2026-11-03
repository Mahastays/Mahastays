import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { getStaff, requireStaff } from '../../middlewares/staff';
import { ok } from '../../utils/apiResponse';
import { bodyOf, objectId } from '../../utils/zod';
import { cancelBooking, previewCancellation } from '../bookings/booking.cancel.service';
import { getStaffBooking, listStaffBookings } from '../bookings/booking.query.service';
import { bookingKindParam, staffBookingQuery, staffCancelSchema } from '../bookings/booking.schemas';

export const adminBookingRouter = Router();

const read = requireStaff({ admin: true, sub_admin: 'canViewBookings' });
const refund = requireStaff({ admin: 'canProcessOverridesAndDisputes', sub_admin: 'canInitiateCustomerRefunds' });

adminBookingRouter.get('/', read, async (req, res) => {
  const { items, meta } = await listStaffBookings(getStaff(req), staffBookingQuery.parse(req.query));
  ok(res, items, meta);
});

adminBookingRouter.get('/:type/:id', read, async (req, res) => {
  ok(res, await getStaffBooking(getStaff(req), bookingKindParam.parse(req.params.type), objectId.parse(req.params.id)));
});

adminBookingRouter.get('/:type/:id/cancellation-preview', refund, async (req, res) => {
  ok(res, await previewCancellation(bookingKindParam.parse(req.params.type), objectId.parse(req.params.id), { role: 'staff', staff: getStaff(req) }));
});

/** Staff cancellation: full refund by default; admins can override the refund amount; sub-admins are capped by their refund ceiling. */
adminBookingRouter.post('/:type/:id/cancel', refund, async (req, res) => {
  const input = staffCancelSchema.parse(bodyOf(req));
  ok(res, await cancelBooking(bookingKindParam.parse(req.params.type), objectId.parse(req.params.id), { role: 'staff', staff: getStaff(req) }, input, req));
});

/** Admin full control: delete order / booking */
adminBookingRouter.delete('/:type/:id', refund, async (req, res) => {
  const type = bookingKindParam.parse(req.params.type);
  const id = objectId.parse(req.params.id);
  if (type === 'stay') {
    await prisma.stayBooking.delete({ where: { id } }).catch(() => null);
  } else if (type === 'package') {
    await prisma.packageBooking.delete({ where: { id } }).catch(() => null);
  } else {
    await prisma.experienceBooking.delete({ where: { id } }).catch(() => null);
  }
  ok(res, { id, deleted: true });
});

adminBookingRouter.delete('/:id', refund, async (req, res) => {
  const id = objectId.parse(req.params.id);
  const [s, p, e] = await Promise.all([
    prisma.stayBooking.findUnique({ where: { id } }),
    prisma.packageBooking.findUnique({ where: { id } }),
    prisma.experienceBooking.findUnique({ where: { id } }),
  ]);
  if (!s && !p && !e) throw ApiError.notFound('Booking');
  if (s) await prisma.stayBooking.delete({ where: { id } });
  else if (p) await prisma.packageBooking.delete({ where: { id } });
  else if (e) await prisma.experienceBooking.delete({ where: { id } });
  ok(res, { id, deleted: true });
});
