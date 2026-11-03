import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

const ENC_KEY = crypto.createHash('sha256').update(env.ENCRYPTION_KEY).digest(); // 32 bytes

export const sha256 = (input: string): string => crypto.createHash('sha256').update(input).digest('hex');

export const randomToken = (bytes = 32): string => crypto.randomBytes(bytes).toString('hex');

export const randomObjectId = (): string => crypto.randomBytes(12).toString('hex');

export function randomDigits(length = 6): string {
  return String(crypto.randomInt(0, 10 ** length)).padStart(length, '0');
}

/** Upper-case, unambiguous code (no 0/O/1/I) — used for voucher codes. */
export function randomCode(length = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) out += alphabet[crypto.randomInt(0, alphabet.length)];
  return out;
}

export const hmacSha256Hex = (secret: string, payload: string | Buffer): string =>
  crypto.createHmac('sha256', secret).update(payload).digest('hex');

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** AES-256-GCM. Output: v1.<iv>.<tag>.<ciphertext> (base64url). */
export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
}

export function decrypt(payload: string): string {
  const [version, iv, tag, data] = payload.split('.');
  if (version !== 'v1' || !iv || !tag || !data) throw new Error('Unsupported ciphertext format');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, env.BCRYPT_ROUNDS);

export const verifyPassword = (plain: string, hash: string): Promise<boolean> => bcrypt.compare(plain, hash);
