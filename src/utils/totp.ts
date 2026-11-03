import crypto from 'node:crypto';
import { safeEqual } from './crypto';

// RFC 6238 time-based one-time passwords (SHA-1, 6 digits, 30 s) — compatible with
// Google Authenticator, Authy, 1Password, etc.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function hotp(secret: Buffer, counter: number, digits = 6): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(code % 10 ** digits).padStart(digits, '0');
}

export function totp(secretBase32: string, nowMs = Date.now(), stepSeconds = 30, digits = 6): string {
  return hotp(base32Decode(secretBase32), Math.floor(nowMs / 1000 / stepSeconds), digits);
}

export function verifyTotp(secretBase32: string, token: string, opts: { window?: number; nowMs?: number } = {}): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const { window = 1, nowMs = Date.now() } = opts;
  const secret = base32Decode(secretBase32);
  const counter = Math.floor(nowMs / 1000 / 30);
  let valid = false;
  for (let w = -window; w <= window; w += 1) {
    if (safeEqual(hotp(secret, counter + w), token)) valid = true; // no early exit: constant work
  }
  return valid;
}

export const generateTotpSecret = (): string => base32Encode(crypto.randomBytes(20));

export function otpauthUrl(input: { issuer: string; account: string; secret: string }): string {
  const issuer = encodeURIComponent(input.issuer);
  return `otpauth://totp/${issuer}:${encodeURIComponent(input.account)}?secret=${input.secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
