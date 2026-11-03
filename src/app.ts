import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type Request } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { API_PREFIX } from './config/constants';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { globalLimiter } from './middlewares/rateLimiter';
import { requestId } from './middlewares/requestId';
import { apiRouter } from './routes';

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
      allowedHeaders: ['Content-Type', 'Authorization', 'x-client-type', 'x-master-pin', 'x-request-id'],
      exposedHeaders: ['x-request-id'],
      maxAge: 600,
    }),
  );
  app.use(compression());
  app.use(globalLimiter);

  // The payment webhook signature is computed over the EXACT bytes the gateway sent, so this route gets a raw
  // body parser — and it must be registered BEFORE express.json().
  app.use(`${API_PREFIX}/payments/verify-webhook`, express.raw({ type: '*/*', limit: '1mb' }));
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));
  app.use(cookieParser());

  app.use(API_PREFIX, apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
