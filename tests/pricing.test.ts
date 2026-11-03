import { describe, expect, it } from 'vitest';
import {
  calculateExperiencePricing,
  calculatePackagePricing,
  calculateSettlement,
  calculateStayPricing,
  splitGst,
} from '../src/modules/bookings/pricing.engine';
import type { PricingConfig } from '../src/services/platformConfig.service';
import { eachNight } from '../src/utils/dates';

const cfg: PricingConfig = {
  gstStaysPercent: 18,
  gstPackagesPercent: 5,
  gstExperiencesPercent: 5,
  cleaningFeeRatePercent: 5,
  gearInsuranceFeeRatePercent: 4,
  clubMemberDiscountPercent: 8,
  packageChildPricePercent: 60,
  experienceChildPricePercent: 70,
  dynamicPricingEnabled: false,
  holidayDates: [],
};

describe('stay pricing — matches the spec ledger', () => {
  const nights = eachNight('2026-10-15', '2026-10-18'); // 3 nights

  it('club member: ₹5,500 × 3 nights → ₹18,237', () => {
    const l = calculateStayPricing({ room: { basePrice: 5500 }, nights, quantity: 1, isClubMember: true }, cfg);
    expect(l).toMatchObject({
      roomPricePerNight: 5500,
      baseTotal: 16500,
      cleaningFee: 275,
      memberDiscount: 1320,
      taxableSubtotal: 15455,
      taxesGst: 2782,
      grandTotalInr: 18237,
    });
    expect(l.nightlyBreakdown).toBeUndefined();
  });

  it('non-member pays no discount', () => {
    const l = calculateStayPricing({ room: { basePrice: 5500 }, nights, quantity: 1, isClubMember: false }, cfg);
    expect(l.memberDiscount).toBe(0);
    expect(l.taxableSubtotal).toBe(16500 + 275);
    expect(l.grandTotalInr).toBe(16775 + Math.round(16775 * 0.18));
  });

  it('multiple units scale base and cleaning fee', () => {
    const l = calculateStayPricing({ room: { basePrice: 5500 }, nights, quantity: 2, isClubMember: false }, cfg);
    expect(l.baseTotal).toBe(33000);
    expect(l.cleaningFee).toBe(550);
  });

  it('ignores weekend/holiday prices unless dynamic pricing is enabled', () => {
    const room = { basePrice: 5500, weekendPrice: 7500, holidayPrice: 9000 };
    const fri = eachNight('2026-10-16', '2026-10-18'); // Fri + Sat nights
    expect(calculateStayPricing({ room, nights: fri, quantity: 1, isClubMember: false }, cfg).baseTotal).toBe(11000);
    const dyn = calculateStayPricing({ room, nights: fri, quantity: 1, isClubMember: false }, { ...cfg, dynamicPricingEnabled: true });
    expect(dyn.baseTotal).toBe(15000);
    expect(dyn.nightlyBreakdown).toHaveLength(2);
  });

  it('holiday price beats weekend price', () => {
    const room = { basePrice: 5500, weekendPrice: 7500, holidayPrice: 9000 };
    const l = calculateStayPricing(
      { room, nights: ['2026-10-17'], quantity: 1, isClubMember: false },
      { ...cfg, dynamicPricingEnabled: true, holidayDates: ['2026-10-17'] },
    );
    expect(l.baseTotal).toBe(9000);
  });

  it('uses configured rates, not hard-coded ones', () => {
    const l = calculateStayPricing({ room: { basePrice: 1000 }, nights: ['2026-10-15'], quantity: 1, isClubMember: false }, { ...cfg, gstStaysPercent: 12, cleaningFeeRatePercent: 0 });
    expect(l.taxesGst).toBe(120);
    expect(l.grandTotalInr).toBe(1120);
  });
});

describe('package pricing — matches the spec ledger', () => {
  it('2 adults × ₹11,500, member → ₹22,218', () => {
    const l = calculatePackagePricing({ pricePerPerson: 11500, adults: 2, children: 0, startDate: '2026-10-15', isClubMember: true }, cfg);
    expect(l).toMatchObject({ adultsCost: 23000, childrenCost: 0, baseCost: 23000, memberDiscount: 1840, taxableAmount: 21160, taxesGst: 1058, grandTotalInr: 22218 });
  });

  it('children pay 60% of the adult price by default', () => {
    const l = calculatePackagePricing({ pricePerPerson: 10000, adults: 2, children: 1, startDate: '2026-10-15', isClubMember: false }, cfg);
    expect(l.childrenCost).toBe(6000);
  });

  it('explicit childPrice wins', () => {
    const l = calculatePackagePricing({ pricePerPerson: 10000, childPrice: 4000, adults: 1, children: 2, startDate: '2026-10-15', isClubMember: false }, cfg);
    expect(l.childrenCost).toBe(8000);
  });

  it('weekend surcharge only applies when dynamic pricing is on and the start is Fri/Sat', () => {
    const base = { pricePerPerson: 10000, adults: 2, children: 0, weekendSurcharge: 2500, isClubMember: false };
    expect(calculatePackagePricing({ ...base, startDate: '2026-10-16' }, cfg).weekendSurcharge).toBe(0);
    expect(calculatePackagePricing({ ...base, startDate: '2026-10-16' }, { ...cfg, dynamicPricingEnabled: true }).weekendSurcharge).toBe(2500);
    expect(calculatePackagePricing({ ...base, startDate: '2026-10-14' }, { ...cfg, dynamicPricingEnabled: true }).weekendSurcharge).toBe(0);
  });
});

describe('experience pricing — matches the spec ledger', () => {
  it('2 adults × ₹350, member → ₹706', () => {
    const l = calculateExperiencePricing({ pricePerPerson: 350, adults: 2, children: 0, isClubMember: true }, cfg);
    expect(l).toMatchObject({ adultsCost: 700, childrenCost: 0, baseCost: 700, memberDiscount: 56, gearInsuranceFee: 28, taxableAmount: 672, taxesGst: 34, grandTotalInr: 706 });
  });

  it('children pay 70% and everyone pays gear insurance', () => {
    const l = calculateExperiencePricing({ pricePerPerson: 500, adults: 1, children: 1, isClubMember: false }, cfg);
    expect(l.childrenCost).toBe(350);
    expect(l.gearInsuranceFee).toBe(20 * 2);
  });
});

describe('GST split', () => {
  it('splits intra-state supplies into CGST + SGST (odd paise go to SGST)', () => {
    expect(splitGst(2782, 'Maharashtra', 'maharashtra')).toEqual({ cgst: 1391, sgst: 1391, igst: 0 });
    expect(splitGst(1059, 'Maharashtra')).toEqual({ cgst: 529, sgst: 530, igst: 0 });
  });
  it('uses IGST for inter-state supplies', () => {
    expect(splitGst(1000, 'Maharashtra', 'Karnataka')).toEqual({ cgst: 0, sgst: 0, igst: 1000 });
  });
});

describe('commission settlement', () => {
  const terms = { commissionType: 'percentage' as const, propertyCommissionRatePercent: 12, packageCommissionRatePercent: 10, experienceCommissionRatePercent: 15 };
  it('commission is charged on the pre-GST value; vendor keeps the rest of the payment', () => {
    expect(calculateSettlement(terms, 'stay', 15455, 18237)).toEqual({ commissionRatePercent: 12, commissionAmountInr: 1855, vendorShareInr: 16382 });
  });
  it('supports fixed commissions', () => {
    const r = calculateSettlement({ ...terms, commissionType: 'fixed', experienceCommissionRatePercent: 50 }, 'experience', 672, 706);
    expect(r).toEqual({ commissionRatePercent: 50, commissionAmountInr: 50, vendorShareInr: 656 });
  });
});
