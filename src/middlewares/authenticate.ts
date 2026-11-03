import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Role } from '../config/constants';
import { verifyAccessToken } from '../services/token.service';
import { ApiError } from '../utils/ApiError';
import { tagAccess } from './access';
import { chain } from './chain';

function readBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/** Requires a valid access token; sets req.auth. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = readBearer(req);
  if (!token) throw ApiError.unauthorized();
  try {
    const claims = verifyAccessToken(token);
    req.auth = { id: claims.sub, role: claims.role };
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token', 'TOKEN_INVALID');
  }
}

/** Populates req.auth when a valid token is present; never rejects (for public endpoints that personalise). */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = readBearer(req);
  if (token) {
    try {
      const claims = verifyAccessToken(token);
      req.auth = { id: claims.sub, role: claims.role };
    } catch {
      /* ignore invalid tokens on public routes */
    }
  }
  next();
}

/** authenticate + role gate. Usage: router.get('/x', requireRole('vendor'), handler) */
export function requireRole(...roles: Role[]): RequestHandler {
  return tagAccess(
    chain(authenticate, (req, _res, next) => {
      if (!req.auth || !roles.includes(req.auth.role)) throw ApiError.forbidden();
      next();
    }),
    roles.join(' | '),
  );
}

tagAccess(authenticate, 'any signed-in user');
tagAccess(optionalAuth, 'public (personalised when signed in)');
