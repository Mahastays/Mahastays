import type { PlatformConfig } from '@prisma/client';
import { DEFAULT_PLATFORM_CONFIG } from '../config/constants';
import { prisma } from '../lib/prisma';
import { isUniqueViolation } from '../utils/prismaErrors';

const TTL_MS = 30_000;
let cache: { value: PlatformConfig; at: number } | null = null;

/** Singleton config document (created from the spec defaults on first read). Cached for 30 s. */
export async function getPlatformConfig(): Promise<PlatformConfig> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  let doc = await prisma.platformConfig.findUnique({ where: { key: 'global' } });
  if (!doc) {
    try {
      doc = await prisma.platformConfig.create({ data: { key: 'global', ...DEFAULT_PLATFORM_CONFIG } });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      doc = await prisma.platformConfig.findUniqueOrThrow({ where: { key: 'global' } });
    }
  }
  cache = { value: doc, at: Date.now() };
  return doc;
}

export function invalidatePlatformConfigCache(): void {
  cache = null;
}

/** The numbers the pricing engine needs — decoupled from the DB shape so it stays unit-testable. */
export interface PricingConfig {
  gstStaysPercent: number;
  gstPackagesPercent: number;
  gstExperiencesPercent: number;
  cleaningFeeRatePercent: number;
  gearInsuranceFeeRatePercent: number;
  clubMemberDiscountPercent: number;
  packageChildPricePercent: number;
  experienceChildPricePercent: number;
  dynamicPricingEnabled: boolean;
  holidayDates: string[];
}

export function toPricingConfig(cfg: PlatformConfig): PricingConfig {
  return {
    gstStaysPercent: cfg.gstRates.staysStandardGstPercent,
    gstPackagesPercent: cfg.gstRates.packagesGstPercent,
    gstExperiencesPercent: cfg.gstRates.experiencesGstPercent,
    cleaningFeeRatePercent: cfg.platformFees.defaultCleaningFeeRatePercent,
    gearInsuranceFeeRatePercent: cfg.platformFees.defaultGearInsuranceFeeRatePercent,
    clubMemberDiscountPercent: cfg.platformFees.clubMemberDiscountPercent,
    packageChildPricePercent: cfg.platformFees.packageChildPricePercent,
    experienceChildPricePercent: cfg.platformFees.experienceChildPricePercent,
    dynamicPricingEnabled: cfg.dynamicPricing.enabled,
    holidayDates: cfg.dynamicPricing.holidayDates,
  };
}

export type PlatformConfigPatch = {
  platformBookingsEnabled?: boolean;
  platformBookingsMessage?: string;
  gstRates?: Partial<PlatformConfig['gstRates']>;
  platformFees?: Partial<PlatformConfig['platformFees']>;
  cancellationWindowRules?: Partial<PlatformConfig['cancellationWindowRules']>;
  defaultCommission?: Partial<PlatformConfig['defaultCommission']>;
  payoutRules?: Partial<PlatformConfig['payoutRules']>;
  dynamicPricing?: Partial<PlatformConfig['dynamicPricing']>;
};

export async function updatePlatformConfig(
  patch: PlatformConfigPatch,
  superAdminId: string,
): Promise<{ before: PlatformConfig; after: PlatformConfig }> {
  const before = await getPlatformConfig();
  const updateData: any = {
    gstRates: { ...before.gstRates, ...patch.gstRates },
    platformFees: { ...before.platformFees, ...patch.platformFees },
    cancellationWindowRules: { ...before.cancellationWindowRules, ...patch.cancellationWindowRules },
    defaultCommission: { ...before.defaultCommission, ...patch.defaultCommission },
    payoutRules: { ...before.payoutRules, ...patch.payoutRules },
    dynamicPricing: { ...before.dynamicPricing, ...patch.dynamicPricing },
    updatedBySuperAdminId: superAdminId,
  };
  if (patch.platformBookingsEnabled !== undefined) {
    updateData.platformBookingsEnabled = patch.platformBookingsEnabled;
  }
  if (patch.platformBookingsMessage !== undefined) {
    updateData.platformBookingsMessage = patch.platformBookingsMessage;
  }

  const after = await prisma.platformConfig.update({
    where: { key: 'global' },
    data: updateData,
  });
  invalidatePlatformConfigCache();
  return { before, after };
}
