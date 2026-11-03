import { env } from '../../config/env';
import { hmacSha256Hex, randomToken, safeEqual } from '../../utils/crypto';
import { toPaise } from '../../utils/money';
import type { CreateOrderInput, GatewayOrder, GatewayPaymentInfo, GatewayRefund, PaymentGateway } from './gateway';

/**
 * Development gateway: lets the whole booking → payment → invoice → payout flow run with no
 * external account. Same HMAC contract as Razorpay, so frontend code paths stay identical.
 * Disabled in production by env validation.
 */
export class MockGateway implements PaymentGateway {
  readonly name = 'mock' as const;
  readonly publicKey = 'mock_key';

  async createOrder(input: CreateOrderInput): Promise<GatewayOrder> {
    return { orderId: `order_mock_${randomToken(8)}`, amountPaise: toPaise(input.amountInr), currency: 'INR' };
  }

  /** Dev helper: what a "successful checkout" would hand back to the frontend. */
  signPayment(orderId: string, paymentId: string): string {
    return hmacSha256Hex(env.MOCK_GATEWAY_SECRET, `${orderId}|${paymentId}`);
  }

  verifyPaymentSignature({ orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string }): boolean {
    return safeEqual(this.signPayment(orderId, paymentId), signature);
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    return safeEqual(hmacSha256Hex(env.MOCK_GATEWAY_SECRET, rawBody), signature);
  }

  async fetchPayment(paymentId: string): Promise<GatewayPaymentInfo | null> {
    return { id: paymentId, status: 'captured', method: 'upi', amountPaise: 0 };
  }

  async refund(input: { paymentId: string; amountInr: number }): Promise<GatewayRefund> {
    return { refundId: `rfnd_mock_${randomToken(6)}`, status: 'processed' };
  }
}
