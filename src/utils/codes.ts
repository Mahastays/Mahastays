import { prisma } from '../lib/prisma';
import { randomCode } from './crypto';
import { todayIST } from './dates';

const readNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    const raw = v.$numberInt ?? v.$numberLong ?? v.$numberDouble;
    if (typeof raw === 'string') return Number(raw);
  }
  return null;
};

/**
 * Atomic, gap-free-on-success counter using MongoDB findAndModify (single-document atomicity).
 * Collection name matches `@@map("counters")` in schema.prisma.
 */
export async function nextSequence(key: string): Promise<number> {
  const result = (await prisma.$runCommandRaw({
    findAndModify: 'counters',
    query: { key },
    update: { $inc: { seq: 1 } },
    new: true,
    upsert: true,
  })) as { value?: { seq?: unknown } | null };
  const seq = readNumber(result.value?.seq);
  if (seq === null) throw new Error(`Failed to allocate sequence for "${key}"`);
  return seq;
}

const year = () => todayIST().slice(0, 4);
const pad = (n: number, width: number) => String(n).padStart(width, '0');

export type BookingPrefix = 'MHA' | 'PKG' | 'EXP';

/** e.g. MHA-2026-0001 (stays), PKG-2026-0001 (packages), EXP-2026-0001 (experiences) */
export async function generateBookingReference(prefix: BookingPrefix): Promise<string> {
  const y = year();
  const seq = await nextSequence(`${prefix}-${y}`);
  return `${prefix}-${y}-${pad(seq, 4)}`;
}

/** e.g. INV-2026-00001 — sequential per calendar year. */
export async function generateInvoiceNumber(): Promise<string> {
  const y = year();
  const seq = await nextSequence(`INV-${y}`);
  return `INV-${y}-${pad(seq, 5)}`;
}

/** e.g. PAYOUT-2026-001 */
export async function generatePayoutReference(): Promise<string> {
  const y = year();
  const seq = await nextSequence(`PAYOUT-${y}`);
  return `PAYOUT-${y}-${pad(seq, 3)}`;
}

/** USR-10001, VND-3001, SUB-501, ADM-201 — offsets keep codes looking like the spec's examples. */
export async function generateActorCode(kind: 'USR' | 'VND' | 'SUB' | 'ADM'): Promise<string> {
  const offsets = { USR: 10_000, VND: 3_000, SUB: 500, ADM: 200 } as const;
  const seq = await nextSequence(`CODE-${kind}`);
  return `${kind}-${offsets[kind] + seq}`;
}

export const generateVoucherCode = (): string => `VOUCH-ACT-${randomCode(6)}`;
