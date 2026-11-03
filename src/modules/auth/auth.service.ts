import jwt from 'jsonwebtoken';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type { Role } from '../../config/constants';
import { prisma } from '../../lib/prisma';
import { audit } from '../../services/audit.service';
import { sendEmail, sendOtpSms } from '../../services/notification.service';
import { templates } from '../../services/notification.templates';
import { getPlatformConfig } from '../../services/platformConfig.service';
import {
  issueTokens,
  revokeAllRefreshTokens,
  rotateRefreshToken,
  signMfaChallenge,
  verifyMfaChallenge,
  type IssuedTokens,
} from '../../services/token.service';
import { ApiError } from '../../utils/ApiError';
import { generateActorCode } from '../../utils/codes';
import { decrypt, encrypt, hashPassword, randomCode, randomDigits, randomToken, safeEqual, sha256, verifyPassword } from '../../utils/crypto';
import { minutesFromNow } from '../../utils/dates';
import { generateTotpSecret, otpauthUrl, verifyTotp } from '../../utils/totp';
import type { RegisterVendorInput } from '../vendors/vendor.schemas';
import {
  findLoginActor,
  findLoginActorById,
  getActorStatus,
  getProfile,
  isStatusAllowed,
  patchActor,
  type LoginActor,
} from './actors';
import type { OtpVerifyInput, SignupUserInput } from './auth.schemas';

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
  clientType?: string;
}

export interface Session {
  tokens: IssuedTokens;
  body: { role: Role; profile: unknown; user?: unknown; accessToken: string; expiresIn: number };
}

type PhoneInput = { countryCode: string; nationalNumber: string };

const defaultMembership = () => ({ isClubMember: false, tier: 'standard' as const });
const defaultPreferences = () => ({ preferredLanguage: 'en', currency: 'INR' });
const defaultVerification = () => ({ isEmailVerified: false, isPhoneVerified: false, isIdVerified: false });

const secondsUntilExpiry = (token: string): number => {
  const d = jwt.decode(token) as { exp?: number; iat?: number } | null;
  return d?.exp && d.iat ? d.exp - d.iat : 900;
};

/* ───────────────────────────── sessions ───────────────────────────── */

export async function createSession(actor: { id: string; role: Role }, meta: RequestMeta): Promise<Session> {
  const tokens = await issueTokens(actor, { ip: meta.ip, userAgent: meta.userAgent });
  await patchActor(actor.role, actor.id, { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null });
  if (actor.role === 'user' && meta.ip) await prisma.user.update({ where: { id: actor.id }, data: { lastLoginIp: meta.ip } });
  const profile = await getProfile(actor.role, actor.id);
  return {
    tokens,
    body: { role: actor.role, profile, user: profile, accessToken: tokens.accessToken, expiresIn: secondsUntilExpiry(tokens.accessToken) },
  };
}

export async function refreshSession(rawToken: string | undefined, meta: RequestMeta): Promise<Session> {
  if (!rawToken) throw ApiError.unauthorized('Refresh token missing', 'REFRESH_INVALID');
  const { actor, tokens } = await rotateRefreshToken(rawToken, { ip: meta.ip, userAgent: meta.userAgent });
  const status = await getActorStatus(actor.role, actor.id);
  if (!status || !isStatusAllowed(actor.role, status)) {
    await revokeAllRefreshTokens(actor.id, actor.role);
    throw ApiError.unauthorized('This account is no longer active', 'ACCOUNT_INACTIVE');
  }
  const profile = await getProfile(actor.role, actor.id);
  return { tokens, body: { role: actor.role, profile, user: profile, accessToken: tokens.accessToken, expiresIn: secondsUntilExpiry(tokens.accessToken) } };
}

/* ─────────────────────── credential checking ─────────────────────── */

let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword('mahastays-dummy-password-for-timing'));

async function registerFailedLogin(actor: LoginActor): Promise<void> {
  const attempts = actor.failedLoginAttempts + 1;
  if (attempts >= env.MAX_FAILED_LOGINS) {
    await patchActor(actor.role, actor.id, { failedLoginAttempts: 0, lockedUntil: minutesFromNow(env.LOCKOUT_MINUTES) });
    await audit({ actor: { id: actor.id, role: actor.role }, action: 'ACCOUNT_LOCKED', targetEntity: actor.role, targetId: actor.id });
  } else {
    await patchActor(actor.role, actor.id, { failedLoginAttempts: attempts });
  }
}

function assertNotLocked(actor: LoginActor | null): void {
  if (actor?.lockedUntil && actor.lockedUntil.getTime() > Date.now()) {
    throw new ApiError(423, 'ACCOUNT_LOCKED', 'Too many failed attempts. Please try again later.');
  }
}

/** Constant-ish time: always performs a bcrypt compare, even for unknown e-mails. */
async function assertPassword(actor: LoginActor | null, password: string): Promise<LoginActor> {
  assertNotLocked(actor);
  const valid = await verifyPassword(password, actor?.passwordHash ?? (await getDummyHash()));
  if (!actor || !actor.passwordHash || !valid) {
    if (actor) await registerFailedLogin(actor);
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }
  if (!isStatusAllowed(actor.role, actor.status)) throw ApiError.forbidden('This account is not active', 'ACCOUNT_INACTIVE');
  return actor;
}

export async function loginWithPassword(role: 'user' | 'vendor', email: string, password: string, meta: RequestMeta): Promise<Session> {
  const actor = await assertPassword(await findLoginActor(role, email), password);
  return createSession({ id: actor.id, role }, meta);
}

/* ───────────────────────────── signup ───────────────────────────── */

async function assertPhoneFree(phone: PhoneInput): Promise<void> {
  const taken = await prisma.user.findFirst({
    where: { phone: { is: { countryCode: phone.countryCode, nationalNumber: phone.nationalNumber } } },
    select: { id: true },
  });
  if (taken) throw ApiError.conflict('This phone number is already registered', 'PHONE_TAKEN');
}

export async function signupUser(input: SignupUserInput, meta: RequestMeta): Promise<Session> {
  if (await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } })) {
    throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
  }
  if (input.phone) await assertPhoneFree(input.phone);

  const user = await prisma.user.create({
    data: {
      userCode: await generateActorCode('USR'),
      fullName: input.fullName,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      authProvider: 'local',
      phone: input.phone ? { ...input.phone, isVerified: false } : undefined,
      membership: defaultMembership(),
      preferences: defaultPreferences(),
      verification: defaultVerification(),
    },
  });
  void sendVerificationEmail(user.id, user.fullName, user.email);
  void sendWelcomeEmail(user.fullName, user.email);
  return createSession({ id: user.id, role: 'user' }, meta);
}

export async function registerVendor(input: RegisterVendorInput, meta: RequestMeta): Promise<Session> {
  if (await prisma.vendor.findUnique({ where: { email: input.email }, select: { id: true } })) {
    throw ApiError.conflict('A vendor account with this email already exists', 'EMAIL_TAKEN');
  }
  const config = await getPlatformConfig();
  const vendor = await prisma.vendor.create({
    data: {
      vendorCode: await generateActorCode('VND'),
      businessType: input.businessType,
      category: input.category,
      businessName: input.businessName,
      displayName: input.displayName,
      displayRole: input.displayRole,
      experienceSummary: input.experienceSummary,
      email: input.email,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      contact: input.contact,
      compliance: { ...input.compliance, verificationStatus: 'pending' },
      commissionTerms: {
        commissionType: 'percentage',
        propertyCommissionRatePercent: config.defaultCommission.propertyCommissionRatePercent,
        packageCommissionRatePercent: config.defaultCommission.packageCommissionRatePercent,
        experienceCommissionRatePercent: config.defaultCommission.experienceCommissionRatePercent,
        payoutCycle: config.defaultCommission.payoutCycle,
      },
      status: 'pending_approval',
    },
  });
  return createSession({ id: vendor.id, role: 'vendor' }, meta);
}

/* ──────────────────────── staff (admin / sub-admin / super-admin) ──────────────────────── */

export type StaffLoginResult =
  | { twoFactorRequired: true; challengeToken: string; expiresInSeconds: number }
  | { twoFactorRequired: false; session: Session };

export function generateRecoveryKeys(count = 8): { keys: string[]; hashes: string[] } {
  const keys = Array.from({ length: count }, () => `${randomCode(4)}-${randomCode(4)}-${randomCode(4)}`);
  return { keys, hashes: keys.map((k) => sha256(k)) };
}

export async function staffLogin(
  input: { email: string; password: string; role?: 'super_admin' | 'admin' | 'sub_admin' },
  meta: RequestMeta,
): Promise<StaffLoginResult> {
  const order: Role[] = input.role ? [input.role] : ['super_admin', 'admin', 'sub_admin'];
  let found: LoginActor | null = null;
  for (const role of order) {
    found = await findLoginActor(role, input.email);
    if (found) break;
  }
  const actor = await assertPassword(found, input.password);

  if (actor.ipWhitelist && actor.ipWhitelist.length > 0 && (!meta.ip || !actor.ipWhitelist.includes(meta.ip))) {
    await audit({ actor: { id: actor.id, role: actor.role }, action: 'STAFF_LOGIN_BLOCKED_IP', targetEntity: actor.role, targetId: actor.id, newState: { ip: meta.ip } });
    throw ApiError.forbidden('Sign-in from this network is not allowed', 'IP_NOT_ALLOWED');
  }

  const tf = actor.twoFactor;
  if (tf?.enabled) {
    return { twoFactorRequired: true, challengeToken: signMfaChallenge(actor.id, actor.role), expiresInSeconds: 300 };
  }
  if (tf?.enforced && env.isProd) {
    throw ApiError.forbidden('Two-factor authentication must be enabled for this account. Contact the platform owner.', 'MFA_SETUP_REQUIRED');
  }

  const session = await createSession({ id: actor.id, role: actor.role }, meta);
  await audit({ actor: { id: actor.id, role: actor.role }, action: 'STAFF_LOGIN', targetEntity: actor.role, targetId: actor.id, newState: { mfa: false, ip: meta.ip } });
  return { twoFactorRequired: false, session };
}

export async function completeStaffLogin(input: { challengeToken: string; code: string }, meta: RequestMeta): Promise<Session> {
  const { sub, role } = verifyMfaChallenge(input.challengeToken);
  const actor = await findLoginActorById(role, sub);
  if (!actor || !isStatusAllowed(actor.role, actor.status) || !actor.twoFactor?.secretEnc) {
    throw ApiError.unauthorized('Two-factor challenge is invalid', 'MFA_CHALLENGE_INVALID');
  }
  assertNotLocked(actor);

  let valid = false;
  let usedRecoveryKey = false;
  if (/^\d{6}$/.test(input.code)) {
    valid = verifyTotp(decrypt(actor.twoFactor.secretEnc), input.code);
  } else if (actor.role === 'super_admin' && actor.recoveryKeyHashes) {
    const hash = sha256(input.code.trim().toUpperCase());
    const match = actor.recoveryKeyHashes.find((h) => safeEqual(h, hash));
    if (match) {
      valid = true;
      usedRecoveryKey = true;
      await prisma.superAdmin.update({ where: { id: actor.id }, data: { recoveryKeyHashes: { set: actor.recoveryKeyHashes.filter((h) => h !== match) } } });
    }
  }
  if (!valid) {
    await registerFailedLogin(actor);
    throw ApiError.unauthorized('Invalid two-factor code', 'INVALID_2FA_CODE');
  }

  const session = await createSession({ id: actor.id, role: actor.role }, meta);
  await audit({ actor: { id: actor.id, role: actor.role }, action: usedRecoveryKey ? 'STAFF_LOGIN_RECOVERY_KEY' : 'STAFF_LOGIN', targetEntity: actor.role, targetId: actor.id, newState: { mfa: true, ip: meta.ip } });
  return session;
}

/* ── 2FA management (admin / super-admin) ── */

type TwoFactorRole = 'admin' | 'super_admin';

async function loadStaffSecurity(role: TwoFactorRole, id: string) {
  if (role === 'admin') {
    const a = await prisma.admin.findUnique({ where: { id } });
    if (!a) throw ApiError.notFound('Account');
    return { email: a.email, passwordHash: a.passwordHash, security: a.security, enforced: false };
  }
  const s = await prisma.superAdmin.findUnique({ where: { id } });
  if (!s) throw ApiError.notFound('Account');
  return { email: s.email, passwordHash: s.passwordHash, security: s.security, enforced: s.isTwoFactorEnforced };
}

async function saveStaffSecurity(role: TwoFactorRole, id: string, security: Prisma.StaffSecurityCreateInput, extra: { recoveryKeyHashes?: string[] } = {}) {
  if (role === 'admin') await prisma.admin.update({ where: { id }, data: { security } });
  else await prisma.superAdmin.update({ where: { id }, data: { security, ...(extra.recoveryKeyHashes ? { recoveryKeyHashes: { set: extra.recoveryKeyHashes } } : {}) } });
}

export async function beginTwoFactorSetup(role: TwoFactorRole, id: string) {
  const current = await loadStaffSecurity(role, id);
  if (current.security.isTwoFactorEnabled) throw ApiError.conflict('Two-factor authentication is already enabled', 'MFA_ALREADY_ENABLED');
  const secret = generateTotpSecret();
  await saveStaffSecurity(role, id, { ...current.security, isTwoFactorEnabled: false, twoFactorSecretEnc: encrypt(secret) });
  return { secret, otpauthUrl: otpauthUrl({ issuer: 'Mahastays', account: current.email, secret }) };
}

export async function enableTwoFactor(role: TwoFactorRole, id: string, code: string) {
  const current = await loadStaffSecurity(role, id);
  if (!current.security.twoFactorSecretEnc) throw ApiError.badRequest('Start the setup first', undefined, 'MFA_SETUP_NOT_STARTED');
  if (!verifyTotp(decrypt(current.security.twoFactorSecretEnc), code)) throw ApiError.badRequest('Invalid code', undefined, 'INVALID_2FA_CODE');
  const recovery = role === 'super_admin' ? generateRecoveryKeys() : null;
  await saveStaffSecurity(role, id, { ...current.security, isTwoFactorEnabled: true }, { recoveryKeyHashes: recovery?.hashes });
  await revokeAllRefreshTokens(id, role);
  return { enabled: true, recoveryKeys: recovery?.keys ?? [] };
}

export async function disableTwoFactor(role: TwoFactorRole, id: string, password: string, code: string) {
  const current = await loadStaffSecurity(role, id);
  if (current.enforced) throw ApiError.forbidden('Two-factor authentication is mandatory for this account', 'MFA_ENFORCED');
  if (!current.security.twoFactorSecretEnc || !(await verifyPassword(password, current.passwordHash))) {
    throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  }
  if (!verifyTotp(decrypt(current.security.twoFactorSecretEnc), code)) throw ApiError.badRequest('Invalid code', undefined, 'INVALID_2FA_CODE');
  await saveStaffSecurity(role, id, { ...current.security, isTwoFactorEnabled: false, twoFactorSecretEnc: null });
  return { enabled: false };
}

/* ───────────────────────── phone OTP (users) ───────────────────────── */

const e164 = (p: PhoneInput) => `${p.countryCode}${p.nationalNumber}`;
const otpHash = (identifier: string, otp: string) => sha256(`${identifier}:${otp}`);

export async function requestPhoneOtp(phone: PhoneInput) {
  const identifier = e164(phone);
  const where = { identifier, purpose: 'phone_login' as const };
  if (await prisma.oneTimeCode.findFirst({ where: { ...where, createdAt: { gt: new Date(Date.now() - 45_000) } } })) {
    throw ApiError.tooMany('Please wait a few seconds before requesting another OTP');
  }
  if ((await prisma.oneTimeCode.count({ where: { ...where, createdAt: { gt: new Date(Date.now() - 3_600_000) } } })) >= 6) {
    throw ApiError.tooMany('OTP limit reached for this number. Try again later.');
  }
  const otp = randomDigits(6);
  await prisma.oneTimeCode.create({
    data: { purpose: 'phone_login', actorRole: 'user', identifier, codeHash: otpHash(identifier, otp), expiresAt: minutesFromNow(5) },
  });
  await sendOtpSms(identifier, otp);
  return { sent: true, expiresInSeconds: 300, ...(env.isDev && env.SMS_PROVIDER === 'console' ? { devOtp: otp } : {}) };
}

export async function verifyPhoneOtp(input: OtpVerifyInput, meta: RequestMeta): Promise<Session> {
  const identifier = e164(input.phone);
  const record = await prisma.oneTimeCode.findFirst({
    where: { identifier, purpose: 'phone_login', consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw ApiError.badRequest('OTP expired or not requested', undefined, 'OTP_INVALID');
  if (record.attempts >= 5) throw ApiError.tooMany('Too many wrong attempts. Request a new OTP.');
  if (!safeEqual(record.codeHash, otpHash(identifier, input.code))) {
    await prisma.oneTimeCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    throw ApiError.badRequest('Incorrect OTP', undefined, 'OTP_INVALID');
  }

  let user = await prisma.user.findFirst({ where: { phone: { is: { countryCode: input.phone.countryCode, nationalNumber: input.phone.nationalNumber } } } });
  if (!user) {
    // New traveller: collect profile details first. The OTP is NOT consumed yet, so the client can resubmit.
    if (!input.fullName || !input.email) {
      throw ApiError.unprocessable('Please provide your name and email to create your account', { required: ['fullName', 'email'] }, 'PROFILE_REQUIRED');
    }
    if (await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } })) {
      throw ApiError.conflict('An account with this email already exists. Sign in with your email instead.', 'EMAIL_TAKEN');
    }
    user = await prisma.user.create({
      data: {
        userCode: await generateActorCode('USR'),
        fullName: input.fullName,
        email: input.email,
        authProvider: 'phone',
        phone: { ...input.phone, isVerified: true },
        membership: defaultMembership(),
        preferences: defaultPreferences(),
        verification: { isEmailVerified: false, isPhoneVerified: true, isIdVerified: false },
      },
    });
    void sendWelcomeEmail(user.fullName, user.email);
  } else {
    if (!isStatusAllowed('user', user.status)) throw ApiError.forbidden('This account is not active', 'ACCOUNT_INACTIVE');
    await prisma.user.update({
      where: { id: user.id },
      data: { phone: { set: { ...input.phone, isVerified: true } }, verification: { set: { ...user.verification, isPhoneVerified: true } } },
    });
  }
  await prisma.oneTimeCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  return createSession({ id: user.id, role: 'user' }, meta);
}

/* ───────────────────────── Google sign-in ───────────────────────── */

const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export async function loginWithGoogle(idToken: string, meta: RequestMeta): Promise<Session> {
  if (!env.GOOGLE_CLIENT_ID) throw ApiError.notImplemented('Google sign-in is not configured (GOOGLE_CLIENT_ID)');
  let claims: { sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
  try {
    const { payload } = await jwtVerify(idToken, googleJwks, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: env.GOOGLE_CLIENT_ID,
    });
    claims = payload as typeof claims;
  } catch {
    throw ApiError.unauthorized('Invalid Google credential', 'GOOGLE_TOKEN_INVALID');
  }
  if (!claims.sub || !claims.email || !claims.email_verified) {
    throw ApiError.unauthorized('Your Google account must have a verified email address', 'GOOGLE_EMAIL_UNVERIFIED');
  }
  const email = claims.email.toLowerCase();

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        userCode: await generateActorCode('USR'),
        fullName: claims.name?.trim() || email.split('@')[0],
        email,
        authProvider: 'google',
        authProviderId: claims.sub,
        avatarUrl: claims.picture,
        membership: defaultMembership(),
        preferences: defaultPreferences(),
        verification: { isEmailVerified: true, isPhoneVerified: false, isIdVerified: false },
      },
    });
    void sendWelcomeEmail(user.fullName, user.email);
  } else {
    if (!isStatusAllowed('user', user.status)) throw ApiError.forbidden('This account is not active', 'ACCOUNT_INACTIVE');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        authProviderId: user.authProviderId ?? claims.sub,
        verification: { set: { ...user.verification, isEmailVerified: true } },
      },
    });
  }
  return createSession({ id: user.id, role: 'user' }, meta);
}

/* ───────────────────── password & e-mail link tokens ───────────────────── */

async function createLinkToken(purpose: 'password_reset' | 'email_verify', role: Role, email: string, ttlMinutes: number): Promise<string> {
  const token = randomToken(32);
  await prisma.oneTimeCode.create({
    data: { purpose, actorRole: role, identifier: `${role}:${email}`, codeHash: sha256(token), expiresAt: minutesFromNow(ttlMinutes) },
  });
  return token;
}

async function consumeLinkToken(purpose: 'password_reset' | 'email_verify', token: string): Promise<{ role: Role; email: string }> {
  const invalid = () => ApiError.badRequest('This link is invalid or has expired', undefined, 'TOKEN_INVALID');
  const record = await prisma.oneTimeCode.findFirst({
    where: { purpose, codeHash: sha256(token), consumedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!record) throw invalid();
  const claim = await prisma.oneTimeCode.updateMany({ where: { id: record.id, consumedAt: null }, data: { consumedAt: new Date() } });
  if (claim.count === 0) throw invalid();
  const [role, ...rest] = record.identifier.split(':');
  return { role: role as Role, email: rest.join(':') };
}

export async function changePassword(role: Role, id: string, currentPassword: string, newPassword: string, meta: RequestMeta): Promise<Session> {
  const actor = await findLoginActorById(role, id);
  if (!actor || !actor.passwordHash || !(await verifyPassword(currentPassword, actor.passwordHash))) {
    throw ApiError.unauthorized('Current password is incorrect', 'INVALID_CREDENTIALS');
  }
  await patchActor(role, id, { passwordHash: await hashPassword(newPassword) });
  await revokeAllRefreshTokens(id, role); // sign out every other device
  await audit({ actor: { id, role }, action: 'PASSWORD_CHANGED', targetEntity: role, targetId: id });
  return createSession({ id, role }, meta);
}

/** Always resolves silently — never reveals whether the e-mail exists. */
export async function forgotPassword(role: 'user' | 'vendor', email: string): Promise<void> {
  const actor = await findLoginActor(role, email);
  if (!actor || !isStatusAllowed(role, actor.status)) return;
  const token = await createLinkToken('password_reset', role, email, 30);
  const mail = templates.passwordReset(actor.fullName, token, role);
  await sendEmail({ to: email, subject: mail.subject, html: mail.html });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const { role, email } = await consumeLinkToken('password_reset', token);
  const actor = await findLoginActor(role, email);
  if (!actor) throw ApiError.badRequest('This link is invalid or has expired', undefined, 'TOKEN_INVALID');
  await patchActor(role, actor.id, { passwordHash: await hashPassword(newPassword), failedLoginAttempts: 0, lockedUntil: null });
  await revokeAllRefreshTokens(actor.id, role);
  await audit({ actor: { id: actor.id, role }, action: 'PASSWORD_RESET', targetEntity: role, targetId: actor.id });
}

export async function sendWelcomeEmail(name: string, email: string): Promise<void> {
  try {
    const mail = templates.welcomeUser({ name, email });
    await sendEmail({ to: email, subject: mail.subject, html: mail.html });
    logger.info({ email, name }, 'Welcome email dispatched to first-time user');
  } catch (err) {
    logger.error({ err, email }, 'Failed to dispatch welcome email');
  }
}

async function sendVerificationEmail(userId: string, name: string, email: string): Promise<void> {
  try {
    const token = await createLinkToken('email_verify', 'user', email, 24 * 60);
    const mail = templates.verifyEmail(name, token);
    await sendEmail({ to: email, subject: mail.subject, html: mail.html });
  } catch {
    /* non-critical */
  }
  void userId;
}

export async function requestEmailVerification(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('Account');
  if (user.verification.isEmailVerified) throw ApiError.conflict('Email is already verified', 'ALREADY_VERIFIED');
  await sendVerificationEmail(user.id, user.fullName, user.email);
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.verification.isEmailVerified) return;
  await sendVerificationEmail(user.id, user.fullName, user.email);
}

export async function confirmEmailVerification(token: string): Promise<void> {
  const { email } = await consumeLinkToken('email_verify', token);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.badRequest('This link is invalid or has expired', undefined, 'TOKEN_INVALID');
  await prisma.user.update({ where: { id: user.id }, data: { verification: { set: { ...user.verification, isEmailVerified: true } } } });
}

