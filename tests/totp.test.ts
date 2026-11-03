import { describe, expect, it } from 'vitest';
import { base32Decode, base32Encode, generateTotpSecret, totp, verifyTotp } from '../src/utils/totp';

// RFC 6238 appendix B test secret ("12345678901234567890"), SHA-1; 6-digit codes are the last 6 digits of the 8-digit vectors.
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890'));

describe('TOTP (RFC 6238)', () => {
  it('matches the RFC test vectors', () => {
    expect(totp(RFC_SECRET, 59_000)).toBe('287082');
    expect(totp(RFC_SECRET, 1_111_111_109_000)).toBe('081804');
    expect(totp(RFC_SECRET, 1_234_567_890_000)).toBe('005924');
  });
  it('accepts ±1 step of clock drift, rejects others', () => {
    const now = 1_700_000_000_000;
    const code = totp(RFC_SECRET, now);
    expect(verifyTotp(RFC_SECRET, code, { nowMs: now })).toBe(true);
    expect(verifyTotp(RFC_SECRET, code, { nowMs: now + 30_000 })).toBe(true);
    expect(verifyTotp(RFC_SECRET, code, { nowMs: now + 120_000 })).toBe(false);
    expect(verifyTotp(RFC_SECRET, '12345', { nowMs: now })).toBe(false);
  });
  it('base32 round-trips', () => {
    const secret = generateTotpSecret();
    expect(base32Encode(base32Decode(secret))).toBe(secret);
  });
});
