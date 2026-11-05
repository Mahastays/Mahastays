import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { env } from '../config/env';

/**
 * Extract real client IP safely across reverse proxies (AWS Lambda / Vercel / Nginx / Cloudflare).
 * Correctly handles RFC 7239 `Forwarded` header, `X-Forwarded-For`, and Express `req.ip`.
 */
export function getClientIp(req: Request): string {
  // 1. Check RFC 7239 Forwarded header (e.g. for=192.0.2.60;proto=http;by=203.0.113.43)
  const forwarded = req.headers['forwarded'];
  if (typeof forwarded === 'string') {
    const match = forwarded.match(/for=(?:["']?\[?)([\w.:]+)(?:\]?["']?)/i);
    if (match && match[1]) {
      return match[1];
    }
  }

  // 2. Check X-Forwarded-For (comma-separated list of IPs, the first one is client IP)
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string') {
    const firstIp = xForwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }
  if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
    const firstIp = xForwardedFor[0]?.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  // 3. Fallback to Express request.ip or socket remote address
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

const limiter = (limit: number, windowMs: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.isTest,
    keyGenerator: (req) => getClientIp(req as Request),
    validate: {
      forwardedHeader: false,
      xForwardedForHeader: false,
      default: true,
    },
    message: { success: false, error: { code: 'RATE_LIMITED', message } },
  });

// NOTE: the default in-memory store is per-process. Behind several instances use a shared store
// (e.g. rate-limit-redis) — see README → "Production checklist".
export const globalLimiter = limiter(env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS, 'Too many requests, please slow down.');
export const authLimiter = limiter(env.AUTH_RATE_LIMIT_MAX, 15 * 60 * 1000, 'Too many authentication attempts. Try again in a few minutes.');
export const otpLimiter = limiter(8, 60 * 60 * 1000, 'Too many OTP requests. Try again later.');
export const trackingLimiter = limiter(180, 60 * 1000, 'Too many tracking events.');
export const sensitiveLimiter = limiter(20, 60 * 60 * 1000, 'Too many attempts on a sensitive operation.');
export const clickLimiter = limiter(30, 10 * 60 * 1000, 'Too many ad interactions.');
