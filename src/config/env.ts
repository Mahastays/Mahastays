import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const truthy = ['true', '1', 'yes', 'on'];
const bool = (fallback: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v.trim() === '' ? fallback : truthy.includes(v.trim().toLowerCase())));

const optionalBool = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v.trim() === '' ? undefined : truthy.includes(v.trim().toLowerCase())));

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? v.trim() : undefined));

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    APP_URL: z.string().default('http://localhost:3000'), // frontend base URL (used in e-mail links)
    API_PUBLIC_URL: z.string().default('http://localhost:4000'),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    LOG_PRETTY: bool(false),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (MongoDB replica-set URL)'),
    REDIS_URL: optionalString,

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_ACCESS_TTL: z.string().default('30d'),
    REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
    COOKIE_DOMAIN: optionalString,
    COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    COOKIE_SECURE: optionalBool,
    ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
    MAX_FAILED_LOGINS: z.coerce.number().int().positive().default(5),
    LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),

    PAYMENT_GATEWAY: z.enum(['mock', 'razorpay']).default('mock'),
    RAZORPAY_KEY_ID: optionalString,
    RAZORPAY_KEY_SECRET: optionalString,
    RAZORPAY_WEBHOOK_SECRET: optionalString,
    MOCK_GATEWAY_SECRET: z.string().default('mahastays-mock-gateway-secret'),

    STORAGE_PROVIDER: z.enum(['none', 'cloudinary', 's3']).default('none'),
    CLOUDINARY_CLOUD_NAME: optionalString,
    CLOUDINARY_API_KEY: optionalString,
    CLOUDINARY_API_SECRET: optionalString,
    CLOUDINARY_FOLDER: z.string().default('mahastays'),
    AWS_REGION: optionalString,
    AWS_ACCESS_KEY_ID: optionalString,
    AWS_SECRET_ACCESS_KEY: optionalString,
    S3_BUCKET: optionalString,
    S3_PUBLIC_BASE_URL: optionalString,

    SMTP_HOST: optionalString,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: bool(false),
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    MAIL_FROM: z.string().default('Mahastays <no-reply@mahastays.com>'),
    MAIL_CLIENT_ID: optionalString,
    MAIL_CLIENT_SECRET: optionalString,
    MAIL_REFRESH_TOKEN: optionalString,
    MAIL_REDIRECT_URI: optionalString,
    MAIL_FROM_EMAIL: optionalString,
    MAIL_FROM_NAME: optionalString,
    SMS_PROVIDER: z.enum(['console', 'msg91']).default('console'),
    MSG91_AUTH_KEY: optionalString,
    MSG91_OTP_TEMPLATE_ID: optionalString,

    GOOGLE_CLIENT_ID: optionalString,

    BOOKING_HOLD_MINUTES: z.coerce.number().int().positive().default(15),
    ENABLE_JOBS: bool(true),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(600),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(40),
  })
  .superRefine((v, ctx) => {
    const need = (cond: boolean, path: string, message: string) => {
      if (!cond) ctx.addIssue({ code: 'custom', path: [path], message });
    };
    if (v.PAYMENT_GATEWAY === 'razorpay') {
      need(!!v.RAZORPAY_KEY_ID, 'RAZORPAY_KEY_ID', 'Required when PAYMENT_GATEWAY=razorpay');
      need(!!v.RAZORPAY_KEY_SECRET, 'RAZORPAY_KEY_SECRET', 'Required when PAYMENT_GATEWAY=razorpay');
      need(!!v.RAZORPAY_WEBHOOK_SECRET, 'RAZORPAY_WEBHOOK_SECRET', 'Required when PAYMENT_GATEWAY=razorpay');
    }
    if (v.STORAGE_PROVIDER === 'cloudinary') {
      need(!!v.CLOUDINARY_CLOUD_NAME, 'CLOUDINARY_CLOUD_NAME', 'Required when STORAGE_PROVIDER=cloudinary');
      need(!!v.CLOUDINARY_API_KEY, 'CLOUDINARY_API_KEY', 'Required when STORAGE_PROVIDER=cloudinary');
      need(!!v.CLOUDINARY_API_SECRET, 'CLOUDINARY_API_SECRET', 'Required when STORAGE_PROVIDER=cloudinary');
    }
    if (v.STORAGE_PROVIDER === 's3') {
      need(!!v.AWS_REGION, 'AWS_REGION', 'Required when STORAGE_PROVIDER=s3');
      need(!!v.S3_BUCKET, 'S3_BUCKET', 'Required when STORAGE_PROVIDER=s3');
    }
    if (v.NODE_ENV === 'production') {
      need(v.PAYMENT_GATEWAY !== 'mock', 'PAYMENT_GATEWAY', 'The mock gateway must not be used in production');
      need(!v.JWT_ACCESS_SECRET.startsWith('change-me'), 'JWT_ACCESS_SECRET', 'Replace the placeholder secret');
      need(!v.ENCRYPTION_KEY.startsWith('change-me'), 'ENCRYPTION_KEY', 'Replace the placeholder key');
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`);
  const message = `Invalid environment configuration:\n${lines.join('\n')}`;
  if (process.env.NODE_ENV === 'test') throw new Error(message);
  // eslint-disable-next-line no-console
  console.error(`\n${message}\n\nCopy .env.example to .env and fill in the values.\n`);
  process.exit(1);
}

const data = parsed.data;

export const env = Object.freeze({
  ...data,
  isProd: data.NODE_ENV === 'production',
  isTest: data.NODE_ENV === 'test',
  isDev: data.NODE_ENV === 'development',
  corsOrigins: data.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  cookieSecure: data.COOKIE_SECURE ?? data.NODE_ENV === 'production',
});

export type Env = typeof env;
