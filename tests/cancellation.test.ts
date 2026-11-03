import { describe, expect, it } from 'vitest';
import { computeCancellation } from '../src/modules/bookings/cancellation.engine';
import { istDateTime } from '../src/utils/dates';

const startsAt = istDateTime('2026-10-15', '14:00'); // check-in 2 PM IST
const base = { startsAt, grandTotalInr: 18237, paidInr: 18237, freeCancellationHours: 48, lateFeePercent: 50 };
const hoursBefore = (h: number) => new Date(startsAt.getTime() - h * 3_600_000);

describe('cancellation & refunds', () => {
  it('full refund when the customer cancels outside the free window', () => {
    expect(computeCancellation({ ...base, now: hoursBefore(72), cancelledBy: 'user' })).toEqual({ refundAmountInr: 18237, penaltyAmountInr: 0, rule: 'FREE_WINDOW' });
  });
  it('exactly at the cut-off still counts as free', () => {
    expect(computeCancellation({ ...base, now: hoursBefore(48), cancelledBy: 'user' }).rule).toBe('FREE_WINDOW');
  });
  it('50% late fee inside the window', () => {
    expect(computeCancellation({ ...base, now: hoursBefore(10), cancelledBy: 'user' })).toEqual({ refundAmountInr: 9118, penaltyAmountInr: 9119, rule: 'LATE_FEE' });
  });
  it('no refund after the service has started', () => {
    expect(computeCancellation({ ...base, now: hoursBefore(-2), cancelledBy: 'user' })).toEqual({ refundAmountInr: 0, penaltyAmountInr: 18237, rule: 'SERVICE_STARTED' });
  });
  it('vendor / admin / system cancellations always refund in full', () => {
    for (const who of ['vendor', 'admin', 'system'] as const) {
      expect(computeCancellation({ ...base, now: hoursBefore(1), cancelledBy: who }).refundAmountInr).toBe(18237);
    }
  });
  it('unpaid bookings have nothing to refund', () => {
    expect(computeCancellation({ ...base, paidInr: 0, now: hoursBefore(1), cancelledBy: 'user' }).rule).toBe('UNPAID');
  });
  it('admin override is capped at the amount paid', () => {
    expect(computeCancellation({ ...base, now: hoursBefore(1), cancelledBy: 'admin', overrideRefundInr: 99999 }).refundAmountInr).toBe(18237);
    expect(computeCancellation({ ...base, now: hoursBefore(1), cancelledBy: 'admin', overrideRefundInr: 5000 })).toMatchObject({ refundAmountInr: 5000, penaltyAmountInr: 13237 });
  });
  it('honours a property-specific free-cancellation window', () => {
    expect(computeCancellation({ ...base, freeCancellationHours: 24, now: hoursBefore(30), cancelledBy: 'user' }).rule).toBe('FREE_WINDOW');
  });
});
