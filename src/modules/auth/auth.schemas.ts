import { z } from 'zod';
import * as v from '../../utils/zod';

export { registerVendorSchema } from '../vendors/vendor.schemas';

export const signupUserSchema = z.object({
  fullName: v.trimmed(2, 120),
  email: v.email,
  password: v.password,
  phone: v.phone.optional(),
});

export const loginSchema = z.object({
  email: v.email,
  password: z.string().min(1).max(128),
});

export const staffLoginSchema = loginSchema.extend({
  role: z.enum(['super_admin', 'admin', 'sub_admin']).optional(),
});

export const staffTwoFactorSchema = z.object({
  challengeToken: z.string().min(20),
  /** 6-digit TOTP code, or (super-admin only) a recovery key such as ABCD-EFGH-IJKL */
  code: z.string().trim().min(6).max(32),
});

export const otpRequestSchema = z.object({ phone: v.phone });

export const otpVerifySchema = z.object({
  phone: v.phone,
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  fullName: v.trimmed(2, 120).optional(),
  email: v.email.optional(),
});

export const googleLoginSchema = z.object({ idToken: z.string().min(20) });

export const refreshSchema = z.object({ refreshToken: z.string().min(20).optional() });

export const verifyEmailOtpSchema = z.object({
  email: v.email,
  code: z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const resendEmailOtpSchema = z.object({
  email: v.email,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().max(128).optional().default(''),
  newPassword: v.password,
});

export const forgotPasswordSchema = z.object({
  role: z.enum(['user', 'vendor']).default('user'),
  email: v.email,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(4).optional(),
  code: z.string().min(4).optional(),
  newPassword: v.password,
}).transform((b) => ({
  token: b.token ?? b.code ?? '',
  newPassword: b.newPassword,
}));

export const confirmEmailSchema = z.object({
  token: z.string().min(4).optional(),
  code: z.string().min(4).optional(),
}).transform((b) => ({
  token: b.token ?? b.code ?? '',
}));

export const enableTwoFactorSchema = z.object({ code: z.string().regex(/^\d{6}$/) });

export const disableTwoFactorSchema = z.object({
  password: z.string().min(1).max(128),
  code: z.string().regex(/^\d{6}$/),
});

export type SignupUserInput = z.infer<typeof signupUserSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
