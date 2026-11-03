import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { API_PREFIX } from './config/constants';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { globalLimiter } from './middlewares/rateLimiter';
import { requestId } from './middlewares/requestId';
import { handleWebhook } from './modules/payments/payment.service';
import { apiRouter } from './routes';

/**
 * Standard paths recognized for Razorpay Payment Webhooks:
 * Supported both under the API_PREFIX (e.g. /api/v1/payments/verify-webhook)
 * and directly at root domain (e.g. /webhook/razorpay).
 */
export const RAZORPAY_WEBHOOK_PATHS = [
  `${API_PREFIX}/payments/verify-webhook`,
  `${API_PREFIX}/payments/webhook`,
  `${API_PREFIX}/webhook/razorpay`,
  `${API_PREFIX}/webhook`,
  '/webhook/razorpay',
  '/webhook',
  '/razorpay-webhook',
];

export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  if (env.TRUST_PROXY > 0) app.set('trust proxy', env.TRUST_PROXY); // correct client IPs behind a load balancer

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as Request).requestId ?? 'unknown',
      autoLogging: {
        ignore: (req) =>
          req.method === 'OPTIONS' ||
          ((req as Request).originalUrl?.startsWith(`${API_PREFIX}/health`) ?? false),
      },
      customLogLevel: (_req, res, err) =>
        err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      customSuccessMessage: (req, res, responseTime) =>
        `${req.method} ${(req as Request).originalUrl || req.url} ${res.statusCode} in ${responseTime}ms`,
      customErrorMessage: (req, res, err) =>
        `${req.method} ${(req as Request).originalUrl || req.url} ${res.statusCode} - ${err.message}`,
      serializers: {
        req: () => undefined,
        res: () => undefined,
      },
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => callback(null, !origin || env.corsOrigins.includes(origin)),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-client-type', 'x-master-pin', 'x-request-id', 'x-razorpay-signature', 'x-webhook-signature'],
      exposedHeaders: ['x-request-id'],
      maxAge: 600,
    }),
  );
  app.use(compression());
  app.use(globalLimiter);

  // ─────────────────────────────────────────────────────────────────────────
  // RAZORPAY PAYMENT WEBHOOK (MOUNTED IN MAIN APP ENTRY BEFORE EXPRESS.JSON)
  // The HMAC-SHA256 signature is calculated over the EXACT raw binary bytes.
  // ─────────────────────────────────────────────────────────────────────────
  app.use(RAZORPAY_WEBHOOK_PATHS, express.raw({ type: '*/*', limit: '5mb' }));

  // Webhook Health & Verification Status Ping
  app.get(RAZORPAY_WEBHOOK_PATHS, (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      service: 'Mahastays Razorpay Payment Confirmation Webhook',
      status: 'active',
      environment: env.NODE_ENV,
      gateway: env.PAYMENT_GATEWAY,
      timestamp: new Date().toISOString(),
    });
  });

  // Main Razorpay Payment Confirmation Webhook Handler
  app.post(RAZORPAY_WEBHOOK_PATHS, async (req: Request, res: Response) => {
    const signature =
      (req.headers['x-razorpay-signature'] as string | undefined) ||
      (req.headers['x-webhook-signature'] as string | undefined) ||
      undefined;

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : typeof req.body === 'string'
      ? Buffer.from(req.body, 'utf8')
      : Buffer.from(JSON.stringify(req.body || {}), 'utf8');

    logger.info(
      {
        path: req.originalUrl || req.url,
        hasSignature: Boolean(signature),
        rawBytesLength: rawBody.length,
      },
      '[webhook] Razorpay payment confirmation webhook received in main app'
    );

    try {
      const result = await handleWebhook(rawBody, signature);
      return res.status(200).json({
        success: true,
        status: 'ok',
        ...result,
      });
    } catch (err: any) {
      logger.error(
        {
          err: err?.message || err,
          path: req.originalUrl || req.url,
        },
        '[webhook] Razorpay payment confirmation webhook processing failed'
      );

      const statusCode = err?.statusCode || (err?.code === 'INVALID_SIGNATURE' ? 401 : 400);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err?.code || 'WEBHOOK_FAILED',
          message: err?.message || 'Webhook verification or processing failed',
        },
      });
    }
  });

  // Standard JSON & Form parsers for all standard API routes
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));
  app.use(cookieParser());

  app.use(API_PREFIX, apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
