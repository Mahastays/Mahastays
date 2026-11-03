import { logger } from '../config/logger';
import { prisma } from '../lib/prisma';
import { lockService } from '../services/lock.service';
import { autoCompleteBookings, expireUnpaidHolds } from '../modules/bookings/booking.lifecycle.service';
import { ensureInvoice } from '../modules/payments/payment.service';
import { retryPendingRefunds } from '../modules/payments/refund.service';
import { ApiError } from '../utils/ApiError';

/**
 * In-process schedulers. Every job is idempotent and uses guarded transactions, so running them on several API
 * instances is safe; with REDIS_URL set a distributed lock additionally makes only one instance run each tick.
 */
const timers: NodeJS.Timeout[] = [];

function every(name: string, intervalMs: number, job: () => Promise<unknown>): void {
  let running = false;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const result = await lockService.withLock(`job:${name}`, job, { ttlMs: 5 * 60_000, waitMs: 0 });
      if (result) logger.info({ job: name, result }, 'job finished');
    } catch (err) {
      const skipped = err instanceof ApiError && err.code === 'LOCK_TIMEOUT'; // another instance is running it
      if (!skipped) logger.error({ err, job: name }, 'job failed');
    } finally {
      running = false;
    }
  }, intervalMs);
  timer.unref();
  timers.push(timer);
}

/** Captured payments that crashed before getting their invoice number. */
async function repairMissingInvoices(): Promise<number> {
  const rows = await prisma.payment.findMany({
    where: { status: { in: ['captured', 'partially_refunded', 'refunded'] }, invoiceNumber: null, capturedAt: { lt: new Date(Date.now() - 120_000) } },
    select: { id: true },
    take: 50,
  });
  for (const r of rows) await ensureInvoice(r.id);
  return rows.length;
}

export async function deactivateExpiredAds(): Promise<number> {
  const r = await prisma.adCampaign.updateMany({
    where: { isActive: true, expiresAt: { lt: new Date() } },
    data: { isActive: false },
  });
  return r.count;
}

export async function expireMemberships(): Promise<number> {
  const users = await prisma.user.findMany({
    where: {
      membership: { is: { isClubMember: true, expiresAt: { lt: new Date() } } },
    },
    select: { id: true, membership: true },
    take: 500,
  });
  for (const u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: {
        membership: {
          set: {
            ...u.membership,
            isClubMember: false,
          },
        },
      },
    });
  }
  return users.length;
}

export function startJobs(): void {
  every('expire-unpaid-holds', 60_000, expireUnpaidHolds);
  every('auto-complete-bookings', 15 * 60_000, () => autoCompleteBookings());
  every('retry-pending-refunds', 5 * 60_000, () => retryPendingRefunds());
  every('repair-missing-invoices', 10 * 60_000, repairMissingInvoices);
  every('deactivate-expired-ads', 60 * 60_000, deactivateExpiredAds);
  every('expire-memberships', 24 * 60 * 60_000, expireMemberships);
  logger.info('background jobs started');
}

export function stopJobs(): void {
  for (const t of timers) clearInterval(t);
  timers.length = 0;
}

