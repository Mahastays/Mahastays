import { Router, type Request } from 'express';
import { z } from 'zod';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { authenticate, requireRole } from '../../middlewares/authenticate';
import { sensitiveLimiter } from '../../middlewares/rateLimiter';
import { ok } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { pageMeta, paginationSchema, skipTake } from '../../utils/pagination';
import { objectId, bodyOf } from '../../utils/zod';
import { paymentSummary } from '../bookings/booking.query.service';
import { streamInvoicePdf } from './invoice.service';
import { handleWebhook, mockCapture, verifyClientPayment } from './payment.service';

export const paymentRouter = Router();

/** Accepts Razorpay's checkout field names as well as our own. */
const verifySchema = z
  .object({
    orderId: z.string().min(5).optional(),
    paymentId: z.string().min(5).optional(),
    signature: z.string().min(10).optional(),
    razorpay_order_id: z.string().min(5).optional(),
    razorpay_payment_id: z.string().min(5).optional(),
    razorpay_signature: z.string().min(10).optional(),
  })
  .transform((b) => ({ orderId: b.orderId ?? b.razorpay_order_id, paymentId: b.paymentId ?? b.razorpay_payment_id, signature: b.signature ?? b.razorpay_signature }))
  .pipe(z.object({ orderId: z.string(), paymentId: z.string(), signature: z.string() }));

/** Frontend calls this right after checkout succeeds; the webhook below is the safety net. */
paymentRouter.post('/verify', requireRole('user'), sensitiveLimiter, async (req, res) => {
  ok(res, await verifyClientPayment(req.auth!.id, verifySchema.parse(bodyOf(req))));
});

/** Gateway → server. The raw body is required for signature verification (parser is mounted in app.ts). */
paymentRouter.post(['/verify-webhook', '/webhook'], async (req, res) => {
  if (!Buffer.isBuffer(req.body)) throw ApiError.badRequest('Webhook body must be raw JSON', undefined, 'INVALID_BODY');
  ok(res, await handleWebhook(req.body, req.get('x-razorpay-signature') ?? req.get('x-webhook-signature') ?? undefined));
});

/** DEV only — simulates a successful checkout when PAYMENT_GATEWAY=mock. */
paymentRouter.post('/mock/capture', requireRole('user'), async (req, res) => {
  if (env.isProd) throw ApiError.notFound('Route');
  const { orderId } = z.object({ orderId: z.string().min(5) }).parse(bodyOf(req));
  ok(res, await mockCapture(req.auth!.id, orderId));
});

paymentRouter.get(['/my', '/mine'], requireRole('user'), async (req, res) => {
  const q = paginationSchema.parse(req.query);
  const where = { userId: req.auth!.id, status: { not: 'initiated' as const } };
  const [total, rows] = await Promise.all([prisma.payment.count({ where }), prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(q) })]);
  ok(res, rows.map((p) => paymentSummary(p)), pageMeta(q, total));
});

async function loadAccessiblePayment(req: Request) {
  const payment = await prisma.payment.findUnique({ where: { id: objectId.parse(req.params.id) } });
  const auth = req.auth!;
  let allowed = false;
  if (payment) {
    if (auth.role === 'user') allowed = payment.userId === auth.id;
    else if (auth.role === 'vendor') allowed = payment.vendorId === auth.id;
    else if (auth.role === 'admin' || auth.role === 'super_admin') allowed = true;
    else if (auth.role === 'sub_admin') {
      const sub = await prisma.subAdmin.findUnique({ where: { id: auth.id }, select: { status: true, permissions: true } });
      allowed = sub?.status === 'active' && sub.permissions.canViewBookings;
    }
  }
  if (!payment || !allowed) throw ApiError.notFound('Payment'); // never reveal that someone else's payment exists
  return payment;
}

paymentRouter.get('/:id', authenticate, async (req, res) => {
  const payment = await loadAccessiblePayment(req);
  ok(res, paymentSummary(payment, req.auth!.role !== 'user' && req.auth!.role !== 'vendor'));
});

paymentRouter.get('/:id/invoice', authenticate, async (req, res) => {
  await streamInvoicePdf(res, await loadAccessiblePayment(req));
});
