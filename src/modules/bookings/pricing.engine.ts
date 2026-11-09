import type { PricingConfig } from '../../services/platformConfig.service';
import { isWeekendNight } from '../../utils/dates';
import { pct } from '../../utils/money';

/**
 * Pure price calculators. Every step mirrors the frontend ledger from the spec, e.g. for a stay:
 *   baseTotal       = pricePerNight × nights
 *   cleaningFee     = round(pricePerNight × 5%)
 *   memberDiscount  = round(baseTotal × 8%)                 (club members only)
 *   taxableSubtotal = baseTotal − memberDiscount + cleaningFee
 *   taxesGst        = round(taxableSubtotal × 18%)
 *   grandTotal      = taxableSubtotal + taxesGst
 * Rates come from PlatformConfig (never hard-coded), so Super-Admin changes apply instantly.
 */

/* ───────────────────────────── stays ───────────────────────────── */

export interface StayPricingInput {
  room: { basePrice: number; weekendPrice?: number | null; holidayPrice?: number | null };
  /** ISO date of every night of the stay: [checkIn, checkOut) */
  nights: string[];
  quantity: number;
  isClubMember: boolean;
}

export interface StayLedger {
  roomPricePerNight: number;
  nights: number;
  quantity: number;
  baseTotal: number;
  cleaningFee: number;
  memberDiscount: number;
  taxableSubtotal: number;
  taxesGst: number;
  grandTotalInr: number;
  gstRatePercent: number;
  /** Present only when dynamic (weekend / holiday) pricing changed at least one night's rate. */
  nightlyBreakdown?: { date: string; rate: number }[];
}

export function nightlyRate(room: StayPricingInput['room'], date: string, cfg: PricingConfig): number {
  if (!cfg.dynamicPricingEnabled) return room.basePrice;
  if (room.holidayPrice && cfg.holidayDates.includes(date)) return room.holidayPrice;
  if (room.weekendPrice && isWeekendNight(date)) return room.weekendPrice;
  return room.basePrice;
}

export function calculateStayPricing(input: StayPricingInput, cfg: PricingConfig): StayLedger {
  const rates = input.nights.map((date) => ({ date, rate: nightlyRate(input.room, date, cfg) }));
  const dynamic = rates.some((r) => r.rate !== input.room.basePrice);
  const baseTotal = rates.reduce((sum, r) => sum + r.rate, 0) * input.quantity;
  const roomPricePerNight = input.room.basePrice;
  const cleaningFee = pct(roomPricePerNight, cfg.cleaningFeeRatePercent) * input.quantity;
  const memberDiscount = input.isClubMember ? pct(baseTotal, cfg.clubMemberDiscountPercent) : 0;
  const taxableSubtotal = baseTotal - memberDiscount + cleaningFee;
  const taxesGst = pct(taxableSubtotal, cfg.gstStaysPercent);
  return {
    roomPricePerNight,
    nights: input.nights.length,
    quantity: input.quantity,
    baseTotal,
    cleaningFee,
    memberDiscount,
    taxableSubtotal,
    taxesGst,
    grandTotalInr: taxableSubtotal + taxesGst,
    gstRatePercent: cfg.gstStaysPercent,
    ...(dynamic ? { nightlyBreakdown: rates } : {}),
  };
}

/* ─────────────────────────── tour packages ─────────────────────────── */

export interface PackagePricingInput {
  pricePerPerson: number;
  priceType?: 'per_person' | 'per_night' | string;
  durationNights?: number;
  /** Explicit child price from the package; otherwise PlatformConfig child % (60%) of the adult price. */
  childPrice?: number | null;
  adults: number;
  children: number;
  startDate: string;
  weekendSurcharge?: number;
  isClubMember: boolean;
}

export interface PackageLedger {
  pricePerPerson: number;
  priceType: 'per_person' | 'per_night';
  adultsCost: number;
  childrenCost: number;
  weekendSurcharge: number;
  baseCost: number;
  memberDiscount: number;
  taxableAmount: number;
  taxesGst: number;
  grandTotalInr: number;
  gstRatePercent: number;
}

export function calculatePackagePricing(input: PackagePricingInput, cfg: PricingConfig): PackageLedger {
  const isPerNight = input.priceType === 'per_night';
  const nights = Math.max(1, input.durationNights || 1);
  const adultsCost = isPerNight ? input.pricePerPerson * nights : input.pricePerPerson * input.adults;
  const childUnit = isPerNight ? 0 : (input.childPrice ?? pct(input.pricePerPerson, cfg.packageChildPricePercent));
  const childrenCost = isPerNight ? 0 : childUnit * input.children;
  const weekendSurcharge = cfg.dynamicPricingEnabled && isWeekendNight(input.startDate) ? (input.weekendSurcharge ?? 0) : 0;
  const baseCost = adultsCost + childrenCost + weekendSurcharge;
  const memberDiscount = input.isClubMember ? pct(baseCost, cfg.clubMemberDiscountPercent) : 0;
  const taxableAmount = baseCost - memberDiscount;
  const taxesGst = pct(taxableAmount, cfg.gstPackagesPercent);
  return {
    pricePerPerson: input.pricePerPerson,
    priceType: isPerNight ? 'per_night' : 'per_person',
    adultsCost,
    childrenCost,
    weekendSurcharge,
    baseCost,
    memberDiscount,
    taxableAmount,
    taxesGst,
    grandTotalInr: taxableAmount + taxesGst,
    gstRatePercent: cfg.gstPackagesPercent,
  };
}

/* ─────────────────────────── experiences ─────────────────────────── */

export interface ExperiencePricingInput {
  pricePerPerson: number;
  priceType?: 'per_person' | 'per_night' | string;
  adults: number;
  children: number;
  isClubMember: boolean;
}

export interface ExperienceLedger {
  pricePerPerson: number;
  priceType: 'per_person' | 'per_night';
  adultsCost: number;
  childrenCost: number;
  baseCost: number;
  memberDiscount: number;
  gearInsuranceFee: number;
  taxableAmount: number;
  taxesGst: number;
  grandTotalInr: number;
  gstRatePercent: number;
}

export function calculateExperiencePricing(input: ExperiencePricingInput, cfg: PricingConfig): ExperienceLedger {
  const isPerNight = input.priceType === 'per_night';
  const participants = input.adults + input.children;
  const adultsCost = isPerNight ? input.pricePerPerson : input.pricePerPerson * input.adults;
  const childrenCost = isPerNight ? 0 : pct(input.pricePerPerson, cfg.experienceChildPricePercent) * input.children;
  const baseCost = adultsCost + childrenCost;
  const memberDiscount = input.isClubMember ? pct(baseCost, cfg.clubMemberDiscountPercent) : 0;
  const gearInsuranceFee = isPerNight
    ? pct(input.pricePerPerson, cfg.gearInsuranceFeeRatePercent)
    : pct(input.pricePerPerson, cfg.gearInsuranceFeeRatePercent) * participants;
  const taxableAmount = baseCost - memberDiscount + gearInsuranceFee;
  const taxesGst = pct(taxableAmount, cfg.gstExperiencesPercent);
  return {
    pricePerPerson: input.pricePerPerson,
    priceType: isPerNight ? 'per_night' : 'per_person',
    adultsCost,
    childrenCost,
    baseCost,
    memberDiscount,
    gearInsuranceFee,
    taxableAmount,
    taxesGst,
    grandTotalInr: taxableAmount + taxesGst,
    gstRatePercent: cfg.gstExperiencesPercent,
  };
}

/* ───────────────────────────── GST split ───────────────────────────── */

const norm = (s?: string | null) => (s ?? '').trim().toLowerCase();

/**
 * Intra-state supply (vendor and customer in the same state) → CGST + SGST halves;
 * inter-state → IGST. When the customer's state is unknown we assume intra-state.
 */
export function splitGst(taxesGst: number, vendorState?: string | null, customerState?: string | null) {
  const interState = !!customerState && !!vendorState && norm(customerState) !== norm(vendorState);
  if (interState) return { cgst: 0, sgst: 0, igst: taxesGst };
  const cgst = Math.floor(taxesGst / 2);
  return { cgst, sgst: taxesGst - cgst, igst: 0 };
}

/* ─────────────────────── commission / vendor share ─────────────────────── */

export interface CommissionTermsLike {
  commissionType: 'percentage' | 'fixed';
  propertyCommissionRatePercent: number;
  packageCommissionRatePercent: number;
  experienceCommissionRatePercent: number;
}

export function commissionRateFor(terms: CommissionTermsLike, kind: 'stay' | 'package' | 'experience'): number {
  return kind === 'stay'
    ? terms.propertyCommissionRatePercent
    : kind === 'package'
      ? terms.packageCommissionRatePercent
      : terms.experienceCommissionRatePercent;
}

/**
 * Commission is charged on the pre-GST (taxable) value. With `fixed` terms the "rate" field is a flat
 * ₹ amount per booking. The vendor receives the customer's payment (incl. GST, which the vendor remits
 * as the supplier of record) minus our commission.
 */
export function calculateSettlement(terms: CommissionTermsLike, kind: 'stay' | 'package' | 'experience', taxableAmount: number, grandTotal: number) {
  const rate = commissionRateFor(terms, kind);
  const commissionAmountInr = terms.commissionType === 'fixed' ? Math.min(Math.round(rate), taxableAmount) : pct(taxableAmount, rate);
  return { commissionRatePercent: rate, commissionAmountInr, vendorShareInr: grandTotal - commissionAmountInr };
}
