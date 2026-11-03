import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const limiter = (limit: number, windowMs: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.isTest,
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
