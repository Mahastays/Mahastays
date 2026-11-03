import { Router } from 'express';
import { z } from 'zod';
import { requireStaff, getStaff } from '../../middlewares/staff';
import { ok } from '../../utils/apiResponse';
import { bodyOf } from '../../utils/zod';
import { audit } from '../../services/audit.service';
import { getPlatformConfig, updatePlatformConfig } from '../../services/platformConfig.service';
import { adminCouponRouter } from '../coupons/coupon.routes';
import { adminLocationsRouter } from '../locations/locations.routes';
import { adminSupportRouter } from '../support/support.routes';
import { adminAdRouter } from '../ads/ad.routes';
import { adminBookingRouter } from './booking.admin';
import { platformDashboard } from './dashboard.admin';
import { adminFinanceRouter } from './finance.admin';
import { adminListingRouter } from './listing.admin';
import { adminReviewRouter } from './review.admin';
import { makeSubAdminRouter } from './staff.admin';
import { adminUserRouter } from './user.admin';
import { adminVendorRouter } from './vendor.admin';
import { adminHeroSlideRouter } from '../hero-slides/hero-slide.routes';

/** Everything under /api/v1/admin — Admin, Sub-Admin (scoped by permission flags) and Super-Admin. */
export const adminRouter = Router();

adminRouter.get('/dashboard', requireStaff({ admin: true, sub_admin: true }), async (_req, res) => {
  ok(res, await platformDashboard());
});

const pct = z.number().min(0).max(100);
const configPatchSchema = z
  .object({
    platformBookingsEnabled: z.boolean().optional(),
    platformBookingsMessage: z.string().max(500).optional(),
    gstRates: z.object({ staysStandardGstPercent: pct, packagesGstPercent: pct, experiencesGstPercent: pct }).partial(),
    platformFees: z
      .object({ defaultCleaningFeeRatePercent: pct, defaultGearInsuranceFeeRatePercent: pct, clubMemberDiscountPercent: pct, packageChildPricePercent: pct, experienceChildPricePercent: pct })
      .partial(),
    cancellationWindowRules: z.object({ defaultFreeCancellationHours: z.number().int().min(0).max(24 * 60), lateCancellationFeePercent: pct }).partial(),
    defaultCommission: z
      .object({ propertyCommissionRatePercent: pct, packageCommissionRatePercent: pct, experienceCommissionRatePercent: pct, payoutCycle: z.enum(['weekly', 'biweekly', 'monthly']) })
      .partial(),
    payoutRules: z.object({ tdsRatePercent: pct, minPayoutAmountInr: z.number().int().min(0).max(10_000_000), holdDaysAfterService: z.number().int().min(0).max(90) }).partial(),
    dynamicPricing: z.object({ enabled: z.boolean(), holidayDates: z.array(z.string()).max(400) }).partial(),
  })
  .partial();

adminRouter.get('/config', requireStaff({ admin: true, sub_admin: true }), async (_req, res) => {
  ok(res, await getPlatformConfig());
});

adminRouter.put('/config', requireStaff({ admin: true }), async (req, res) => {
  const staff = getStaff(req);
  const patch = configPatchSchema.parse(bodyOf(req));
  const { before, after } = await updatePlatformConfig(patch, staff.id);
  await audit({
    actor: { id: staff.id, role: staff.role },
    action: 'UPDATE_PLATFORM_CONFIG',
    targetEntity: 'PlatformConfig',
    targetId: after.id,
    previousState: before,
    newState: after,
    req,
  });
  ok(res, after);
});

adminRouter.use('/vendors', adminVendorRouter);
adminRouter.use('/users', adminUserRouter);
adminRouter.use('/properties', adminListingRouter('property'));
adminRouter.use('/packages', adminListingRouter('package'));
adminRouter.use('/experiences', adminListingRouter('experience'));
adminRouter.use('/bookings', adminBookingRouter);
adminRouter.use('/reviews', adminReviewRouter);
adminRouter.use('/ads', adminAdRouter);
adminRouter.use('/finance', adminFinanceRouter);
adminRouter.use('/coupons', adminCouponRouter);
adminRouter.use('/locations', adminLocationsRouter);
adminRouter.use('/hero-slides', adminHeroSlideRouter);
adminRouter.use('/support', adminSupportRouter);
adminRouter.use('/subadmins', makeSubAdminRouter(requireStaff({ admin: 'canManageSubAdmins' })));

