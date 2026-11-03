import type { ErrorRequestHandler, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';
import { isPrismaError } from '../utils/prismaErrors';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'ROUTE_NOT_FOUND', message: `Cannot ${req.method} ${req.originalUrl.split('?')[0]}`, requestId: req.requestId },
  });
};

function describe(err: unknown): { status: number; code: string; message: string; details?: unknown } {
  if (err instanceof ApiError) return { status: err.statusCode, code: err.code, message: err.message, details: err.details };

  if (err instanceof ZodError) {
    const issueMessages = err.issues.map((i) => {
      const field = i.path.length > 0 ? `${i.path.join('.')}: ` : '';
      return `${field}${i.message}`;
    });
    const message = issueMessages.length > 0 ? issueMessages.join('. ') : 'Request validation failed';
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message,
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    };
  }

  if (isPrismaError(err)) {
    switch (err.code) {
      case 'P2002':
        return { status: 409, code: 'DUPLICATE_RESOURCE', message: 'An account or record with this unique value (e.g. email or code) already exists. Please log in or use a different value.' };
      case 'P2025':
        return { status: 404, code: 'NOT_FOUND', message: 'Record not found' };
      case 'P2023':
        return { status: 400, code: 'INVALID_ID', message: 'Malformed identifier' };
      case 'P2034':
        return { status: 409, code: 'WRITE_CONFLICT', message: 'The record was modified concurrently. Please retry.' };
      default:
        break;
    }
  }

  if (err instanceof jwt.TokenExpiredError) return { status: 401, code: 'TOKEN_EXPIRED', message: 'Access token expired' };
  if (err instanceof jwt.JsonWebTokenError) return { status: 401, code: 'TOKEN_INVALID', message: 'Invalid access token' };

  // body-parser / http-errors style
  const e = err as { status?: number; statusCode?: number; type?: string };
  const status = e?.status ?? e?.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    if (e.type === 'entity.parse.failed') return { status: 400, code: 'INVALID_JSON', message: 'Malformed JSON body' };
    if (e.type === 'entity.too.large') return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' };
    return { status, code: 'BAD_REQUEST', message: (err as Error).message || 'Bad request' };
  }

  return { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong on our side' };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const { status, code, message, details } = describe(err);

  if (status >= 500) logger.error({ err, requestId: req.requestId, path: req.originalUrl }, 'unhandled error');
  else logger.debug({ code, message, requestId: req.requestId }, 'request rejected');

  if (res.headersSent) return;
  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      requestId: req.requestId,
      ...(env.isDev && status >= 500 ? { stack: (err as Error)?.stack } : {}),
    },
  });
};
