import type { Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH, ROLES, type Role } from '../config/constants';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { randomToken, sha256 } from '../utils/crypto';

const ISSUER = 'mahastays';
const ACCESS_AUDIENCE = 'mahastays-api';
const MFA_AUDIENCE = 'mahastays-mfa';
const RACE_GRACE_MS = 10_000;

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenContext {
  ip?: string;
  userAgent?: string;
  familyId?: string;
}

const isRole = (value: unknown): value is Role => typeof value === 'string' && (ROLES as readonly string[]).includes(value);

export function signAccessToken(id: string, role: Role): string {
  return jwt.sign({ role }, env.JWT_ACCESS_SECRET, {
    subject: id,
    issuer: ISSUER,
    audience: ACCESS_AUDIENCE,
    algorithm: 'HS256',
    expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): { sub: string; role: Role } {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: ISSUER,
    audience: ACCESS_AUDIENCE,
    algorithms: ['HS256'],
  });
  if (typeof payload === 'string' || !payload.sub || !isRole(payload.role)) throw new Error('Malformed access token');
  return { sub: payload.sub, role: payload.role };
}

/** Short-lived token proving the password step succeeded; exchanged for tokens after valid email OTP or TOTP. */
export function signMfaChallenge(
  id: string,
  role: Role,
  extra?: { otpHash?: string; email?: string }
): string {
  return jwt.sign({ role, purpose: 'mfa', ...extra }, env.JWT_ACCESS_SECRET, {
    subject: id,
    issuer: ISSUER,
    audience: MFA_AUDIENCE,
    algorithm: 'HS256',
    expiresIn: '10m',
  });
}

export function verifyMfaChallenge(token: string): {
  sub: string;
  role: Role;
  otpHash?: string;
  email?: string;
} {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: ISSUER,
      audience: MFA_AUDIENCE,
      algorithms: ['HS256'],
    });
    if (typeof payload === 'string' || !payload.sub || !isRole(payload.role) || payload.purpose !== 'mfa') {
      throw new Error('bad challenge');
    }
    const anyPayload = payload as any;
    return {
      sub: payload.sub,
      role: payload.role,
      otpHash: anyPayload.otpHash,
      email: anyPayload.email,
    };
  } catch {
    throw ApiError.unauthorized('Two-factor challenge is invalid or expired. Please sign in again.', 'MFA_CHALLENGE_INVALID');
  }
}

export async function issueTokens(actor: { id: string; role: Role }, ctx: TokenContext = {}): Promise<IssuedTokens> {
  const refreshToken = randomToken(48);
  await prisma.refreshToken.create({
    data: {
      actorId: actor.id,
      actorRole: actor.role,
      tokenHash: sha256(refreshToken),
      familyId: ctx.familyId ?? randomToken(12),
      expiresAt: new Date(Date.now() + env.REFRESH_TTL_DAYS * 86_400_000),
      userAgent: ctx.userAgent?.slice(0, 255),
      ip: ctx.ip,
    },
  });
  return { accessToken: signAccessToken(actor.id, actor.role), refreshToken };
}

/**
 * Refresh-token rotation with reuse detection:
 *  • every refresh invalidates the presented token and issues a new one in the same "family";
 *  • presenting an already-rotated token (stolen copy) revokes the whole family;
 *  • a request racing the legitimate rotation (<10 s) is rejected without nuking the session.
 */
export async function rotateRefreshToken(
  rawToken: string,
  ctx: TokenContext = {},
): Promise<{ actor: { id: string; role: Role }; tokens: IssuedTokens }> {
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(rawToken) } });
  if (!record) throw ApiError.unauthorized('Invalid refresh token', 'REFRESH_INVALID');

  if (record.revokedAt) {
    const justRotated = record.replacedByHash && Date.now() - record.revokedAt.getTime() < RACE_GRACE_MS;
    if (justRotated) throw ApiError.unauthorized('Refresh token was just rotated; retry with the new cookie', 'REFRESH_RACE');
    await prisma.refreshToken.updateMany({ where: { familyId: record.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
    throw ApiError.unauthorized('Refresh token reuse detected. Please sign in again.', 'REFRESH_REUSED');
  }
  if (record.expiresAt.getTime() < Date.now()) throw ApiError.unauthorized('Refresh token expired', 'REFRESH_EXPIRED');
  if (!isRole(record.actorRole)) throw ApiError.unauthorized('Invalid refresh token', 'REFRESH_INVALID');

  // Atomically claim the token so two parallel requests cannot both rotate it.
  const claim = await prisma.refreshToken.updateMany({ where: { id: record.id, revokedAt: null }, data: { revokedAt: new Date() } });
  if (claim.count === 0) throw ApiError.unauthorized('Refresh token already used', 'REFRESH_RACE');

  const actor = { id: record.actorId, role: record.actorRole as Role };
  const tokens = await issueTokens(actor, { ...ctx, familyId: record.familyId });
  await prisma.refreshToken.update({ where: { id: record.id }, data: { replacedByHash: sha256(tokens.refreshToken) } });
  return { actor, tokens };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({ where: { tokenHash: sha256(rawToken), revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function revokeAllRefreshTokens(actorId: string, role: Role): Promise<void> {
  await prisma.refreshToken.updateMany({ where: { actorId, actorRole: role, revokedAt: null }, data: { revokedAt: new Date() } });
}

const cookieBase = () => ({
  httpOnly: true,
  secure: env.cookieSecure || env.COOKIE_SAMESITE === 'none',
  sameSite: env.COOKIE_SAMESITE,
  domain: env.COOKIE_DOMAIN,
  path: REFRESH_COOKIE_PATH,
});

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, { ...cookieBase(), maxAge: env.REFRESH_TTL_DAYS * 86_400_000 });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, cookieBase());
}
