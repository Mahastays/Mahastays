import { env } from '../../config/env';
import { MockGateway } from './mock.gateway';
import { RazorpayGateway } from './razorpay.gateway';

export interface CreateOrderInput {
  amountInr: number;
  receipt: string;
  notes?: Record<string, string>;
}

export interface GatewayOrder {
  orderId: string;
  amountPaise: number;
  currency: 'INR';
}

export interface GatewayPaymentInfo {
  id: string;
  status: string;
  method?: string;
  amountPaise: number;
  orderId?: string;
}

export interface GatewayRefund {
  refundId: string;
  status: string;
}

export interface PaymentGateway {
  readonly name: 'razorpay' | 'mock';
  /** Publishable key the frontend needs to open checkout. */
  readonly publicKey: string;
  createOrder(input: CreateOrderInput): Promise<GatewayOrder>;
  verifyPaymentSignature(input: { orderId: string; paymentId: string; signature: string }): boolean;
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
  fetchPayment(paymentId: string): Promise<GatewayPaymentInfo | null>;
  refund(input: { paymentId: string; amountInr: number; reason?: string; idempotencyKey?: string }): Promise<GatewayRefund>;
}

let instance: PaymentGateway | null = null;

export function getPaymentGateway(): PaymentGateway {
  if (!instance) instance = env.PAYMENT_GATEWAY === 'razorpay' ? new RazorpayGateway() : new MockGateway();
  return instance;
}

/** Test helper. */
export function setPaymentGateway(gateway: PaymentGateway | null): void {
  instance = gateway;
}
