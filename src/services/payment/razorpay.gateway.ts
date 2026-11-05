import https from 'node:https';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { ApiError } from '../../utils/ApiError';
import { hmacSha256Hex, safeEqual } from '../../utils/crypto';
import { toPaise } from '../../utils/money';
import type { CreateOrderInput, GatewayOrder, GatewayPaymentInfo, GatewayRefund, PaymentGateway } from './gateway';

const BASE_URL = 'https://api.razorpay.com/v1';

interface RazorpayErrorBody {
  error?: { description?: string; code?: string };
}

/** Thin REST client (no SDK): orders, payment lookup, refunds + HMAC verification. */
export class RazorpayGateway implements PaymentGateway {
  readonly name = 'razorpay' as const;
  readonly publicKey = env.RAZORPAY_KEY_ID as string;

  private async call<T>(path: string, init: { method: 'GET' | 'POST'; body?: unknown; headers?: Record<string, string> }): Promise<T> {
    const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const payload = init.body ? JSON.stringify(init.body) : undefined;
    const url = new URL(`${BASE_URL}${path}`);

    return new Promise<T>((resolve, reject) => {
      const req = https.request(
        url,
        {
          method: init.method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
            ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
            ...init.headers,
          },
          rejectUnauthorized: env.isProd,
          timeout: 15_000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            let json: unknown = {};
            try {
              json = data ? JSON.parse(data) : {};
            } catch {
              json = {};
            }
            if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
              const description = (json as RazorpayErrorBody).error?.description ?? `Razorpay request failed (${res.statusCode})`;
              return reject(ApiError.badGateway(description, 'GATEWAY_ERROR'));
            }
            resolve(json as T);
          });
        }
      );

      req.on('timeout', () => {
        req.destroy(new Error('Razorpay request timed out'));
      });
      req.on('error', (err) => {
        reject(err);
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  async createOrder(input: CreateOrderInput): Promise<GatewayOrder> {
    const order = await this.call<{ id: string; amount: number; currency: 'INR' }>('/orders', {
      method: 'POST',
      body: { amount: toPaise(input.amountInr), currency: 'INR', receipt: input.receipt.slice(0, 40), notes: input.notes },
    });
    return { orderId: order.id, amountPaise: order.amount, currency: 'INR' };
  }

  verifyPaymentSignature({ orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string }): boolean {
    const cleanSecret = (env.RAZORPAY_KEY_SECRET || '').trim().replace(/^["']|["']$/g, '');
    const cleanSig = (signature || '').trim();
    const payload = `${(orderId || '').trim()}|${(paymentId || '').trim()}`;
    const expected = hmacSha256Hex(cleanSecret, payload);
    return safeEqual(expected.toLowerCase(), cleanSig.toLowerCase());
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const cleanSig = (signature || '').trim();
    if (!cleanSig) {
      logger.warn('[webhook] Razorpay webhook verification failed: signature is missing or empty');
      return false;
    }

    const cleanBody = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody || '', 'utf8');
    const primarySecret = (env.RAZORPAY_WEBHOOK_SECRET || '').trim().replace(/^["']|["']$/g, '');
    const fallbackSecret = (env.RAZORPAY_KEY_SECRET || '').trim().replace(/^["']|["']$/g, '');

    // 1. Primary verification: using RAZORPAY_WEBHOOK_SECRET
    if (primarySecret) {
      const expected = hmacSha256Hex(primarySecret, cleanBody);
      if (safeEqual(expected.toLowerCase(), cleanSig.toLowerCase())) {
        return true;
      }
    }

    // 2. Fallback verification: Check if Razorpay Dashboard was configured with API Key Secret instead
    if (fallbackSecret && fallbackSecret !== primarySecret) {
      const expectedFallback = hmacSha256Hex(fallbackSecret, cleanBody);
      if (safeEqual(expectedFallback.toLowerCase(), cleanSig.toLowerCase())) {
        logger.warn(
          '[webhook] Razorpay webhook signature verified using RAZORPAY_KEY_SECRET fallback! (Tip: enter your RAZORPAY_WEBHOOK_SECRET in Razorpay Dashboard -> Webhooks -> Secret for best practice)'
        );
        return true;
      }
    }

    // 3. Diagnostic log for mismatch troubleshooting without exposing full secrets
    const expectedPrimary = primarySecret ? hmacSha256Hex(primarySecret, cleanBody) : 'none';
    logger.warn(
      {
        receivedSignatureLength: cleanSig.length,
        receivedSignatureSample: `${cleanSig.slice(0, 6)}...${cleanSig.slice(-6)}`,
        expectedSignatureSample: expectedPrimary !== 'none' ? `${expectedPrimary.slice(0, 6)}...${expectedPrimary.slice(-6)}` : 'none',
        rawBodyByteLength: cleanBody.length,
        isWebhookSecretConfigured: Boolean(primarySecret),
        webhookSecretLength: primarySecret.length,
        isKeySecretConfigured: Boolean(fallbackSecret),
      },
      '[webhook] Razorpay webhook signature verification failed: signature mismatch between Dashboard secret and server RAZORPAY_WEBHOOK_SECRET'
    );

    return false;
  }

  async fetchPayment(paymentId: string): Promise<GatewayPaymentInfo | null> {
    try {
      const p = await this.call<{ id: string; status: string; method?: string; amount: number; order_id?: string }>(`/payments/${encodeURIComponent(paymentId)}`, { method: 'GET' });
      return { id: p.id, status: p.status, method: p.method, amountPaise: p.amount, orderId: p.order_id };
    } catch {
      return null;
    }
  }

  async refund(input: { paymentId: string; amountInr: number; reason?: string; idempotencyKey?: string }): Promise<GatewayRefund> {
    const refund = await this.call<{ id: string; status: string }>(`/payments/${encodeURIComponent(input.paymentId)}/refund`, {
      method: 'POST',
      body: { amount: toPaise(input.amountInr), speed: 'normal', notes: input.reason ? { reason: input.reason.slice(0, 250) } : undefined },
      headers: input.idempotencyKey ? { 'X-Refund-Idempotency': input.idempotencyKey } : undefined,
    });
    return { refundId: refund.id, status: refund.status };
  }
}
