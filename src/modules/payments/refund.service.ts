import { logger } from '../../config/logger';
import { prisma } from '../../lib/prisma';
import { getPaymentGateway } from '../../services/payment/gateway';
import { randomToken } from '../../utils/crypto';

/** Placeholder id stored until the gateway confirms the refund; doubles as the gateway idempotency key. */
export const newPendingRefundId = (): string => `pending_${randomToken(8)}`;

/**
 * Sends one refund to the gateway and records the outcome on the payment.
 * Never throws: on failure the record stays `initiated` and `retryPendingRefunds` picks it up.
 */
export async function dispatchRefund(input: {
  paymentId: string;
  gatewayPaymentId: string;
  pendingRefundId: string;
  amountInr: number;
  reason?: string;
}): Promise<'processed' | 'pending'> {
  try {
    const r = await getPaymentGateway().refund({
      paymentId: input.gatewayPaymentId,
      amountInr: input.amountInr,
      reason: input.reason,
      idempotencyKey: input.pendingRefundId,
    });
    await prisma.payment.update({
      where: { id: input.paymentId },
      data: { refunds: { updateMany: { where: { refundId: input.pendingRefundId }, data: { refundId: r.refundId, status: r.status } } } },
    });
    return 'processed';
  } catch (err) {
    logger.error({ err, paymentId: input.paymentId, pendingRefundId: input.pendingRefundId }, 'refund dispatch failed — will retry');
    return 'pending';
  }
}

/** Background job: re-sends refunds the gateway has not accepted yet (network error, gateway outage, ...). */
export async function retryPendingRefunds(olderThanMs = 120_000): Promise<number> {
  const cutoff = Date.now() - olderThanMs;
  const payments = await prisma.payment.findMany({
    where: { refunds: { some: { status: 'initiated' } }, gatewayPaymentId: { not: null } },
    take: 50,
  });
  let retried = 0;
  for (const p of payments) {
    for (const r of p.refunds.filter((x) => x.status === 'initiated' && x.createdAt.getTime() < cutoff)) {
      const outcome = await dispatchRefund({
        paymentId: p.id,
        gatewayPaymentId: p.gatewayPaymentId as string,
        pendingRefundId: r.refundId,
        amountInr: r.amountInr,
        reason: r.reason ?? undefined,
      });
      if (outcome === 'processed') retried += 1;
    }
  }
  return retried;
}
