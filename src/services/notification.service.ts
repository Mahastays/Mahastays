import { createTransport, type Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { prisma } from '../lib/prisma';

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const mailClientId = env.MAIL_CLIENT_ID || process.env.MAIL_CLIENT_ID;
  const mailClientSecret = env.MAIL_CLIENT_SECRET || process.env.MAIL_CLIENT_SECRET;
  const mailRefreshToken = env.MAIL_REFRESH_TOKEN || process.env.MAIL_REFRESH_TOKEN;
  const mailFromEmail = env.MAIL_FROM_EMAIL || process.env.MAIL_FROM_EMAIL || 'support@mahastays.com';

  // Prefer Gmail OAuth2 when configured
  if (mailClientId && mailClientSecret && mailRefreshToken) {
    try {
      transporter = createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: mailFromEmail,
          clientId: mailClientId,
          clientSecret: mailClientSecret,
          refreshToken: mailRefreshToken,
        },
      });
      logger.info({ user: mailFromEmail }, '[email] Gmail OAuth2 transporter active');
      return transporter;
    } catch (err) {
      logger.error({ err }, '[email] Failed to initialize Gmail OAuth2 transporter');
    }
  }

  // Fallback to SMTP host if provided
  transporter = env.SMTP_HOST
    ? createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      })
    : null;
  return transporter;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** Never throws: notification failures must not fail a booking or an approval. */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const t = getTransporter();
  const fromName = env.MAIL_FROM_NAME || process.env.MAIL_FROM_NAME || 'Mahastays';
  const fromEmail = env.MAIL_FROM_EMAIL || process.env.MAIL_FROM_EMAIL || 'support@mahastays.com';
  const fromAddress = `"${fromName}" <${fromEmail}>`;

  if (!t) {
    logger.info({ to: message.to, subject: message.subject }, '[email] Mail transport not configured — logged only');
    return;
  }
  try {
    await t.sendMail({ from: fromAddress, ...message });
    logger.info({ to: message.to, subject: message.subject }, '[email] Email sent successfully');
  } catch (err) {
    logger.error({ err, to: message.to, subject: message.subject }, 'email send failed');
  }
}

/**
 * OTP SMS. In India, promotional/transactional SMS must use DLT-registered templates —
 * configure your approved OTP template id in MSG91 (MSG91_OTP_TEMPLATE_ID).
 */
export async function sendOtpSms(phoneE164: string, otp: string): Promise<void> {
  if (env.SMS_PROVIDER === 'msg91' && env.MSG91_AUTH_KEY && env.MSG91_OTP_TEMPLATE_ID) {
    try {
      const mobile = phoneE164.replace(/^\+/, '');
      const url = new URL('https://control.msg91.com/api/v5/otp');
      url.searchParams.set('template_id', env.MSG91_OTP_TEMPLATE_ID);
      url.searchParams.set('mobile', mobile);
      url.searchParams.set('authkey', env.MSG91_AUTH_KEY);
      url.searchParams.set('otp', otp);
      url.searchParams.set('otp_expiry', '5');
      const res = await fetch(url, { method: 'POST', signal: AbortSignal.timeout(10_000) });
      if (!res.ok) logger.error({ status: res.status }, 'MSG91 OTP request failed');
    } catch (err) {
      logger.error({ err }, 'MSG91 OTP request error');
    }
    return;
  }
  // Console provider: never print OTPs in production logs.
  logger.info(env.isProd ? { to: phoneE164 } : { to: phoneE164, otp }, '[sms] OTP (console provider)');
}

/** Free-form transactional SMS/WhatsApp hook — wire your provider/DLT template here. */
export async function sendTransactionalSms(phoneE164: string, message: string): Promise<void> {
  logger.info({ to: phoneE164, message }, '[sms] transactional message (provider not configured — logged only)');
}

export interface NotifyInput {
  recipientId: string;
  role: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  email?: string | null;
  emailHtml?: string;
}

/** Stores an in-app notification and (optionally) emails it. Never throws. */
export async function notify(n: NotifyInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        recipientId: n.recipientId,
        recipientRole: n.role,
        type: n.type,
        title: n.title,
        body: n.body,
        data: (n.data ?? undefined) as any,
      },
    });
    if (n.email) {
      await sendEmail({
        to: n.email,
        subject: n.title,
        html: n.emailHtml ?? `<div style="font-family:Arial,sans-serif"><h2>${n.title}</h2><p>${n.body}</p><p>— Team Mahastays</p></div>`,
      });
    }
  } catch (err: any) {
    logger.error({ err: err?.message, type: n.type }, 'notify failed');
  }
}

