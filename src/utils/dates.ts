import { WEEKDAY_KEYS } from '../config/constants';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const IST_OFFSET_MS = 330 * 60 * 1000; // UTC+05:30, no DST
const DAY_MS = 86_400_000;

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function toUtcDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  return formatIsoDate(new Date(toUtcDate(value).getTime() + days * DAY_MS));
}

/** Number of whole days from `from` to `to` (to - from). */
export function diffDays(from: string, to: string): number {
  return Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / DAY_MS);
}

/** Dates of every night of a stay: [checkIn, checkOut). */
export function eachNight(checkIn: string, checkOut: string): string[] {
  const nights = diffDays(checkIn, checkOut);
  return Array.from({ length: Math.max(0, nights) }, (_, i) => addDays(checkIn, i));
}

/** Inclusive list of dates from..to. */
export function eachDayInclusive(from: string, to: string): string[] {
  const n = diffDays(from, to) + 1;
  return Array.from({ length: Math.max(0, n) }, (_, i) => addDays(from, i));
}

/** Today's calendar date in India (the business timezone). */
export function todayIST(now: Date = new Date()): string {
  return formatIsoDate(new Date(now.getTime() + IST_OFFSET_MS));
}

export function dayOfWeek(value: string): number {
  return toUtcDate(value).getUTCDay(); // 0 = Sunday
}

export function weekdayKey(value: string): (typeof WEEKDAY_KEYS)[number] {
  return WEEKDAY_KEYS[dayOfWeek(value)];
}

/** Friday and Saturday nights are "weekend nights" for dynamic pricing. */
export function isWeekendNight(value: string): boolean {
  const d = dayOfWeek(value);
  return d === 5 || d === 6;
}

/** Converts a local India date + "HH:mm" to the matching UTC instant. */
export function istDateTime(date: string, hhmm: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh || 0, mm || 0) - IST_OFFSET_MS);
}

export function minutesFromNow(minutes: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + minutes * 60_000);
}

export function ageFromDob(dob: string | null | undefined, now: Date = new Date()): number | null {
  if (!dob || !isValidIsoDate(dob)) return null;
  const [y, m, d] = dob.split('-').map(Number);
  let age = now.getUTCFullYear() - y;
  const hadBirthday = now.getUTCMonth() + 1 > m || (now.getUTCMonth() + 1 === m && now.getUTCDate() >= d);
  if (!hadBirthday) age -= 1;
  return age;
}

/** "14:00" -> "2:00 PM" (display alias used by the frontend). */
export function to12Hour(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m || 0).padStart(2, '0')} ${suffix}`;
}

/**
 * First clock time found in a slot label, as 24-hour "HH:mm".
 * "6:00 AM – 8:00 AM" -> "06:00", "3 PM to 6 PM" -> "15:00". Falls back to 09:00.
 */
export function parseSlotStart(label: string): string {
  const m = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i.exec(label);
  if (!m) return '09:00';
  let hour = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') hour += 12;
  return `${String(hour).padStart(2, '0')}:${m[2] ?? '00'}`;
}
