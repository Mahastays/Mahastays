import { describe, expect, it } from 'vitest';
import { computePayout } from '../src/modules/payouts/payout.engine';

describe('payout settlement', () => {
  const bookings = [
    { bookingType: 'stay' as const, bookingId: 'a', reference: 'MHA-2026-0001', taxableAmountInr: 15455, commissionAmountInr: 1855, vendorShareInr: 18237 - 1855 },
    { bookingType: 'experience' as const, bookingId: 'b', reference: 'EXP-2026-0001', taxableAmountInr: 672, commissionAmountInr: 101, vendorShareInr: 706 - 101 },
  ];

  it('net = gross − commission − TDS', () => {
    const p = computePayout(bookings, 1);
    expect(p.grossBookingsAmountInr).toBe(18943);
    expect(p.platformCommissionDeductedInr).toBe(1956);
    expect(p.tdsDeductedInr).toBe(155 + 7); // round(15455 × 1%) + round(672 × 1%)
    expect(p.vendorShareTotalInr).toBe(18943 - 1956);
    expect(p.netPayableAmountInr).toBe(18943 - 1956 - 162);
    expect(p.lines).toHaveLength(2);
  });

  it('settles a late-cancellation penalty as its own line (vendor keeps penalty − commission)', () => {
    const penalty = 9119;
    const commission = Math.round(penalty * 0.12);
    const p = computePayout(
      [{ bookingType: 'stay', bookingId: 'c', reference: 'MHA-2026-0002', taxableAmountInr: penalty, commissionAmountInr: commission, vendorShareInr: penalty - commission }],
      1,
    );
    expect(p.grossBookingsAmountInr).toBe(penalty);
    expect(p.netPayableAmountInr).toBe(penalty - commission - Math.round(penalty * 0.01));
  });

  it('TDS rate is configurable (0% means no deduction)', () => {
    expect(computePayout(bookings, 0).tdsDeductedInr).toBe(0);
  });
});
