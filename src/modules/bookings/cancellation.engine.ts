import { pct } from '../../utils/money';

export type CancelActor = 'user' | 'vendor' | 'admin' | 'system';

export interface CancellationInput {
  now: Date;
  /** The instant the service starts (check-in time / first day / activity slot start). */
  startsAt: Date;
  grandTotalInr: number;
  /** Money actually collected for this booking. */
  paidInr: number;
  cancelledBy: CancelActor;
  freeCancellationHours: number;
  lateFeePercent: number;
  /** Admin override: refund exactly this amount (capped to what was paid). */
  overrideRefundInr?: number;
}

export interface CancellationOutcome {
  refundAmountInr: number;
  penaltyAmountInr: number;
  rule: 'UNPAID' | 'PROVIDER_CANCELLED' | 'FREE_WINDOW' | 'LATE_FEE' | 'SERVICE_STARTED' | 'ADMIN_OVERRIDE';
}

/**
 * Refund policy (defaults from PlatformConfig; properties can override hours / fee):
 *  • customer cancels ≥ N hours before start  → full refund
 *  • customer cancels later but before start   → late fee (default 50%) kept, remainder refunded
 *  • customer cancels after start / no-show    → no refund
 *  • vendor, admin or system cancels           → always a full refund
 */
export function computeCancellation(i: CancellationInput): CancellationOutcome {
  if (i.paidInr <= 0) return { refundAmountInr: 0, penaltyAmountInr: 0, rule: 'UNPAID' };

  if (i.overrideRefundInr !== undefined) {
    const refund = Math.max(0, Math.min(i.overrideRefundInr, i.paidInr));
    return { refundAmountInr: refund, penaltyAmountInr: i.paidInr - refund, rule: 'ADMIN_OVERRIDE' };
  }
  if (i.cancelledBy !== 'user') return { refundAmountInr: i.paidInr, penaltyAmountInr: 0, rule: 'PROVIDER_CANCELLED' };

  const freeUntil = i.startsAt.getTime() - i.freeCancellationHours * 3_600_000;
  if (i.now.getTime() <= freeUntil) return { refundAmountInr: i.paidInr, penaltyAmountInr: 0, rule: 'FREE_WINDOW' };

  if (i.now.getTime() < i.startsAt.getTime()) {
    const penalty = Math.min(i.paidInr, pct(i.grandTotalInr, i.lateFeePercent));
    return { refundAmountInr: i.paidInr - penalty, penaltyAmountInr: penalty, rule: 'LATE_FEE' };
  }
  return { refundAmountInr: 0, penaltyAmountInr: i.paidInr, rule: 'SERVICE_STARTED' };
}
