import { describe, expect, it } from 'vitest';
import { decrypt, encrypt, safeEqual } from '../src/utils/crypto';
import { addDays, diffDays, eachNight, isValidIsoDate, istDateTime, isWeekendNight, parseSlotStart, to12Hour, todayIST, weekdayKey } from '../src/utils/dates';
import { haversineKm } from '../src/utils/geo';
import { slugify } from '../src/utils/slug';
import { formatInr, pct } from '../src/utils/money';

describe('crypto', () => {
  it('AES-GCM round-trips and is non-deterministic', () => {
    const a = encrypt('1234567890');
    expect(decrypt(a)).toBe('1234567890');
    expect(encrypt('1234567890')).not.toBe(a);
  });
  it('detects tampering', () => {
    const parts = encrypt('secret').split('.');
    parts[3] = Buffer.from('tampered').toString('base64url');
    expect(() => decrypt(parts.join('.'))).toThrow();
  });
  it('safeEqual handles length mismatches', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('dates', () => {
  it('validates calendar dates', () => {
    expect(isValidIsoDate('2026-02-29')).toBe(false);
    expect(isValidIsoDate('2028-02-29')).toBe(true);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
    expect(isValidIsoDate('26-1-1')).toBe(false);
  });
  it('computes nights across month and year boundaries', () => {
    expect(diffDays('2026-12-30', '2027-01-02')).toBe(3);
    expect(eachNight('2026-12-30', '2027-01-02')).toEqual(['2026-12-30', '2026-12-31', '2027-01-01']);
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });
  it('knows weekdays and weekend nights (Fri/Sat)', () => {
    expect(weekdayKey('2026-10-16')).toBe('fri');
    expect(isWeekendNight('2026-10-16')).toBe(true);
    expect(isWeekendNight('2026-10-17')).toBe(true);
    expect(isWeekendNight('2026-10-18')).toBe(false);
  });
  it('converts IST wall-clock to UTC instants and today in IST', () => {
    expect(istDateTime('2026-10-15', '14:00').toISOString()).toBe('2026-10-15T08:30:00.000Z');
    expect(todayIST(new Date('2026-10-14T20:00:00Z'))).toBe('2026-10-15'); // already tomorrow in India
  });
  it('parses the start time of slot labels', () => {
    expect(parseSlotStart('6:00 AM – 8:00 AM')).toBe('06:00');
    expect(parseSlotStart('3 PM to 6 PM')).toBe('15:00');
    expect(parseSlotStart('12:30 PM')).toBe('12:30');
    expect(parseSlotStart('12:00 AM')).toBe('00:00');
    expect(parseSlotStart('Sunset batch')).toBe('09:00');
  });
  it('formats 12-hour display times', () => {
    expect(to12Hour('14:00')).toBe('2:00 PM');
    expect(to12Hour('00:30')).toBe('12:30 AM');
    expect(to12Hour('11:00')).toBe('11:00 AM');
  });
});

describe('misc helpers', () => {
  it('slugifies names', () => {
    expect(slugify('HillView Luxury Resort & Spa')).toBe('hillview-luxury-resort-and-spa');
    expect(slugify('  Café — Déjà vu!! ')).toBe('cafe-deja-vu');
  });
  it('formats rupees in the Indian grouping', () => {
    expect(formatInr(1234567)).toBe('₹12,34,567');
    expect(pct(15455, 18)).toBe(2782);
  });
  it('haversine distance ≈ real distance (Mahabaleshwar → Panchgani ≈ 18 km)', () => {
    const km = haversineKm(17.9237, 73.6586, 17.9217, 73.8218);
    expect(km).toBeGreaterThan(15);
    expect(km).toBeLessThan(20);
  });
});
