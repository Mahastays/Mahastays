import { Router, type Request, type RequestHandler, type Response } from 'express';
import { REFRESH_COOKIE_NAME } from '../../config/constants';
import { env } from '../../config/env';
import { authenticate } from '../../middlewares/authenticate';
import { authLimiter, otpLimiter } from '../../middlewares/rateLimiter';
import { getStaff, requireStaff } from '../../middlewares/staff';
import { clearRefreshCookie, revokeAllRefreshTokens, revokeRefreshToken, setRefreshCookie } from '../../services/token.service';
import { ok } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { bodyOf } from '../../utils/zod';
import { getProfile } from './actors';
import * as svc from './auth.service';
import type { RequestMeta, Session } from './auth.service';
import {
  changePasswordSchema,
  confirmEmailSchema,
  disableTwoFactorSchema,
  enableTwoFactorSchema,
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  refreshSchema,
  registerVendorSchema,
  resetPasswordSchema,
  signupUserSchema,
  staffLoginSchema,
  staffTwoFactorSchema,
} from './auth.schemas';

export const authRouter = Router();

/**
 * Cookie-authenticated endpoints (/refresh, /logout) reject cross-site requests: browsers always send `Origin`
 * on cross-site POSTs, so an Origin outside CORS_ORIGINS means a forged request. (Needed when COOKIE_SAMESITE=none.)
 */
const originGuard: RequestHandler = (req, _res, next) => {
  const origin = req.get('origin');
  if (origin && !env.corsOrigins.includes(origin)) throw ApiError.forbidden('Origin not allowed', 'ORIGIN_NOT_ALLOWED');
  next();
};

const metaOf = (req: Request): RequestMeta => ({
  ip: req.ip,
  userAgent: req.get('user-agent') ?? undefined,
  clientType: req.get('x-client-type') ?? undefined,
});

/** Sets the HTTP-only refresh cookie and returns the access token. Mobile clients (x-client-type: mobile) also get the refresh token in the body. */
function sendSession(res: Response, session: Session, meta: RequestMeta, status = 200): void {
  setRefreshCookie(res, session.tokens.refreshToken);
  ok(res, { ...session.body, ...(meta.clientType === 'mobile' ? { refreshToken: session.tokens.refreshToken } : {}) }, undefined, status);
}

/* ── customers ── */
authRouter.post('/user/signup', authLimiter, async (req, res) => {
  const meta = metaOf(req);
  sendSession(res, await svc.signupUser(signupUserSchema.parse(bodyOf(req)), meta), meta, 201);
});

authRouter.post('/user/login', authLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(bodyOf(req));
  const meta = metaOf(req);
  sendSession(res, await svc.loginWithPassword('user', email, password, meta), meta);
});

authRouter.post(['/user/otp/request', '/user/phone/request-otp'], otpLimiter, async (req, res) => {
  const { phone } = otpRequestSchema.parse(bodyOf(req));
  ok(res, await svc.requestPhoneOtp(phone));
});

authRouter.post(['/user/otp/verify', '/user/phone/verify-otp'], authLimiter, async (req, res) => {
  const meta = metaOf(req);
  sendSession(res, await svc.verifyPhoneOtp(otpVerifySchema.parse(bodyOf(req)), meta), meta);
});

authRouter.post('/user/google', authLimiter, async (req, res) => {
  const { idToken } = googleLoginSchema.parse(bodyOf(req));
  const meta = metaOf(req);
  sendSession(res, await svc.loginWithGoogle(idToken, meta), meta);
});

/* ── vendors ── */
authRouter.post('/vendor/register', authLimiter, async (req, res) => {
  const meta = metaOf(req);
  sendSession(res, await svc.registerVendor(registerVendorSchema.parse(bodyOf(req)), meta), meta, 201);
});

authRouter.post('/vendor/login', authLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(bodyOf(req));
  const meta = metaOf(req);
  sendSession(res, await svc.loginWithPassword('vendor', email, password, meta), meta);
});

/* ── staff: admin / super-admin / sub-admin (Email OTP for admin & super-admin) ── */
authRouter.post('/admin/login', authLimiter, async (req, res) => {
  const meta = metaOf(req);
  const result = await svc.staffLogin(staffLoginSchema.parse(bodyOf(req)), meta);
  if (result.twoFactorRequired) {
    ok(res, {
      twoFactorRequired: true,
      requiresOtp: true,
      challengeToken: result.challengeToken,
      expiresInSeconds: result.expiresInSeconds,
      email: result.email,
      message: result.message,
    });
    return;
  }
  sendSession(res, result.session, meta);
});

authRouter.post(['/admin/login/verify-otp', '/admin/login/2fa', '/admin/2fa/verify', '/admin/verify-otp'], authLimiter, async (req, res) => {
  const meta = metaOf(req);
  sendSession(res, await svc.completeStaffLogin(staffTwoFactorSchema.parse(bodyOf(req)), meta), meta);
});

authRouter.post('/admin/login/resend-otp', otpLimiter, async (req, res) => {
  const challengeToken = req.body?.challengeToken;
  if (!challengeToken || typeof challengeToken !== 'string') {
    throw ApiError.badRequest('Challenge token is required to resend verification code');
  }
  ok(res, await svc.resendStaffLoginOtp(challengeToken));
});

const twoFactorRole = (req: Request) => {
  const staff = getStaff(req);
  if (staff.role === 'sub_admin') throw ApiError.forbidden();
  return { role: staff.role, id: staff.id };
};

authRouter.post(['/admin/2fa/setup', '/2fa/setup'], requireStaff({ admin: true }), async (req, res) => {
  const { role, id } = twoFactorRole(req);
  ok(res, await svc.beginTwoFactorSetup(role, id));
});

authRouter.post(['/admin/2fa/enable', '/2fa/enable'], requireStaff({ admin: true }), async (req, res) => {
  const { role, id } = twoFactorRole(req);
  ok(res, await svc.enableTwoFactor(role, id, enableTwoFactorSchema.parse(bodyOf(req)).code));
});

authRouter.post(['/admin/2fa/disable', '/2fa/disable'], requireStaff({ admin: true }), async (req, res) => {
  const { role, id } = twoFactorRole(req);
  const { password, code } = disableTwoFactorSchema.parse(bodyOf(req));
  ok(res, await svc.disableTwoFactor(role, id, password, code));
});

/* ── session management ── */
authRouter.post('/refresh', originGuard, authLimiter, async (req, res) => {
  const meta = metaOf(req);
  const raw = (req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined) ?? refreshSchema.parse(bodyOf(req)).refreshToken;
  sendSession(res, await svc.refreshSession(raw, meta), meta);
});

authRouter.post('/logout', originGuard, async (req, res) => {
  const raw = (req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined) ?? refreshSchema.parse(bodyOf(req)).refreshToken;
  if (raw) await revokeRefreshToken(raw);
  clearRefreshCookie(res);
  ok(res, { loggedOut: true });
});

authRouter.post('/logout-all', authenticate, async (req, res) => {
  const auth = req.auth!;
  await revokeAllRefreshTokens(auth.id, auth.role);
  clearRefreshCookie(res);
  ok(res, { loggedOut: true });
});

authRouter.get('/me', authenticate, async (req, res) => {
  const auth = req.auth!;
  const profile = await getProfile(auth.role, auth.id);
  ok(res, { role: auth.role, profile, user: profile });
});

authRouter.post('/change-password', authenticate, authLimiter, async (req, res) => {
  const auth = req.auth!;
  const { currentPassword, newPassword } = changePasswordSchema.parse(bodyOf(req));
  const meta = metaOf(req);
  sendSession(res, await svc.changePassword(auth.role, auth.id, currentPassword, newPassword, meta), meta);
});

/* ── password reset & e-mail verification ── */
authRouter.post(['/password/forgot', '/forgot-password'], otpLimiter, async (req, res) => {
  const { role, email } = forgotPasswordSchema.parse(bodyOf(req));
  await svc.forgotPassword(role, email);
  ok(res, { message: 'If an account exists for this email, a reset link has been sent.' });
});

authRouter.post(['/password/reset', '/reset-password'], authLimiter, async (req, res) => {
  const { token, newPassword } = resetPasswordSchema.parse(bodyOf(req));
  await svc.resetPassword(token, newPassword);
  ok(res, { message: 'Password updated. Please sign in with your new password.' });
});

authRouter.post('/email/verify/request', authenticate, otpLimiter, async (req, res) => {
  if (req.auth!.role !== 'user') throw ApiError.forbidden();
  await svc.requestEmailVerification(req.auth!.id);
  ok(res, { message: 'Verification email sent.', sent: true });
});

authRouter.post('/user/resend-verification', otpLimiter, async (req, res) => {
  const email = req.body?.email;
  if (email && typeof email === 'string') {
    await svc.resendVerificationEmail(email);
  }
  ok(res, { message: 'Verification email sent.', sent: true });
});

authRouter.post(['/email/verify/confirm', '/user/verify-email'], authLimiter, async (req, res) => {
  await svc.confirmEmailVerification(confirmEmailSchema.parse(bodyOf(req)).token);
  ok(res, { message: 'Email verified.' });
});

