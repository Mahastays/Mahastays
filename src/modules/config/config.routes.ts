import { Router } from 'express';
import { getPlatformConfig } from '../../services/platformConfig.service';
import { ok } from '../../utils/apiResponse';

export const publicConfigRouter = Router();

/**
 * Pricing parameters the frontend needs for display (badges like "8% member discount", tax lines, cancellation text).
 * Same source of truth as the server-side pricing engine — never hard-code these numbers in the UI.
 * For the authoritative amount to charge always use POST /bookings/*\/quote.
 */
publicConfigRouter.get('/public', async (_req, res) => {
  const c = await getPlatformConfig();
  res.setHeader('Cache-Control', 'public, max-age=60');
  const anyConfig: any = c;
  ok(res, {
    currency: 'INR',
    platformBookingsEnabled: anyConfig.platformBookingsEnabled !== false,
    platformBookingsMessage: anyConfig.platformBookingsMessage || '',
    gstRatesPercent: { stays: c.gstRates.staysStandardGstPercent, packages: c.gstRates.packagesGstPercent, experiences: c.gstRates.experiencesGstPercent },
    clubMemberDiscountPercent: c.platformFees.clubMemberDiscountPercent,
    cleaningFeeRatePercent: c.platformFees.defaultCleaningFeeRatePercent,
    gearInsuranceFeeRatePercent: c.platformFees.defaultGearInsuranceFeeRatePercent,
    childPricePercent: { packages: c.platformFees.packageChildPricePercent, experiences: c.platformFees.experienceChildPricePercent },
    cancellation: { defaultFreeCancellationHours: c.cancellationWindowRules.defaultFreeCancellationHours, lateCancellationFeePercent: c.cancellationWindowRules.lateCancellationFeePercent },
    dynamicPricingEnabled: c.dynamicPricing.enabled,
  });
});
