import { Router } from 'express';
import { requireApprovedVendor, requireVendor } from '../../middlewares/vendor';
import { sensitiveLimiter } from '../../middlewares/rateLimiter';
import { ok } from '../../utils/apiResponse';
import { paginationSchema } from '../../utils/pagination';
import { bodyOf, objectId } from '../../utils/zod';
import { vendorAdRouter } from '../ads/ad.routes';
import { redeemVoucher } from '../bookings/booking.lifecycle.service';
import { redeemVoucherSchema } from '../bookings/booking.schemas';
import { vendorBookingRouter } from '../bookings/vendor.booking.routes';
import { vendorExperienceRouter } from '../experiences/experience.routes';
import { vendorPackageRouter } from '../packages/package.routes';
import { getPayout, listPayouts, previewPayout, requestPayout } from '../payouts/payout.service';
import { payoutListQuery, requestPayoutSchema } from '../payouts/payout.schemas';
import { vendorPropertyRouter } from '../properties/property.routes';
import { listVendorReviews, replyToReview } from '../reviews/review.service';
import { replySchema } from '../reviews/review.schemas';
import { bankingSchema, submitKycSchema, updateVendorProfileSchema } from './vendor.schemas';
import { dashboard, getVendorMe, saveBanking, submitKyc, updateVendorProfile } from './vendor.service';

/** Everything under /api/v1/vendor */
export const vendorRouter = Router();

/* profile, KYC, banking */
vendorRouter.get('/me', requireVendor(), async (req, res) => {
  ok(res, await getVendorMe(req.vendor!.id));
});
vendorRouter.put('/me', requireVendor(), async (req, res) => {
  ok(res, await updateVendorProfile(req.vendor!.id, updateVendorProfileSchema.parse(bodyOf(req))));
});
vendorRouter.put('/me/kyc', requireVendor(), async (req, res) => {
  ok(res, await submitKyc(req.vendor!.id, submitKycSchema.parse(bodyOf(req)), req));
});
vendorRouter.put('/me/banking', requireVendor(), async (req, res) => {
  ok(res, await saveBanking(req.vendor!.id, bankingSchema.parse(bodyOf(req)), req));
});

vendorRouter.get('/dashboard', requireVendor(), async (req, res) => {
  ok(res, await dashboard(req.vendor!.id));
});

/* wallet & payouts */
vendorRouter.get('/wallet', requireVendor(), async (req, res) => {
  ok(res, await previewPayout(req.vendor!.id));
});
vendorRouter.get('/payouts', requireVendor(), async (req, res) => {
  const q = payoutListQuery.parse(req.query);
  const { items, meta } = await listPayouts({ ...q, vendorId: req.vendor!.id });
  ok(res, items, meta);
});
vendorRouter.post('/payouts/request', requireApprovedVendor(), sensitiveLimiter, async (req, res) => {
  ok(res, await requestPayout(req.vendor!.id, requestPayoutSchema.parse(bodyOf(req)), req), undefined, 201);
});
vendorRouter.get('/payouts/:id', requireVendor(), async (req, res) => {
  ok(res, await getPayout(objectId.parse(req.params.id), { vendorId: req.vendor!.id }));
});

/* reviews */
vendorRouter.get('/reviews', requireVendor(), async (req, res) => {
  const { items, meta } = await listVendorReviews(req.vendor!.id, paginationSchema.parse(req.query));
  ok(res, items, meta);
});
vendorRouter.post('/reviews/:id/reply', requireVendor(), async (req, res) => {
  ok(res, await replyToReview(req.vendor!.id, objectId.parse(req.params.id), replySchema.parse(bodyOf(req)).reply));
});

/* free-activity voucher scanning */
vendorRouter.post('/vouchers/redeem', requireVendor(), async (req, res) => {
  ok(res, await redeemVoucher(req.vendor!.id, redeemVoucherSchema.parse(bodyOf(req)).voucherCode));
});

/* listings, bookings, ads */
vendorRouter.use('/properties', vendorPropertyRouter);
vendorRouter.use('/packages', vendorPackageRouter);
vendorRouter.use('/experiences', vendorExperienceRouter);
vendorRouter.use('/bookings', vendorBookingRouter);
vendorRouter.use('/ads', vendorAdRouter);
