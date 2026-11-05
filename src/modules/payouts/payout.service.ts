import type { Request } from 'express';
import type { Prisma, TransferMethod } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { runGuarded } from '../../lib/tx';
import { audit } from '../../services/audit.service';
import { lockService } from '../../services/lock.service';
import { sendEmail } from '../../services/notification.service';
import { getPlatformConfig } from '../../services/platformConfig.service';
import { ApiError } from '../../utils/ApiError';
import { randomObjectId } from '../../utils/crypto';
import { generatePayoutReference } from '../../utils/codes';
import { addDays, todayIST } from '../../utils/dates';
import { pageMeta, skipTake, type PaginationInput } from '../../utils/pagination';
import type { StaffContext } from '../../types/auth';
import { computePayout, type SettlementBooking } from './payout.engine';
import { presentPayout } from './payout.presenter';

type Kind = 'stay' | 'package' | 'experience';
interface EligibleBooking extends SettlementBooking {
  kind: Kind;
  createdAt: Date;
}

/** Service delivered (or forfeited) OR cancelled with a retained penalty — and not yet paid out. */
const settledClause = <S extends string>(settled: readonly S[]) =>
  [{ bookingStatus: { in: [...settled] } }, { bookingStatus: 'cancelled', paymentStatus: { in: ['paid', 'partially_refunded'] } }] as never;

const SELECT = { id: true, bookingReference: true, taxableAmountInr: true, commissionAmountInr: true, vendorShareInr: true, createdAt: true } as const;

async function findEligible(vendorId: string, upTo: string): Promise<EligibleBooking[]> {
  const base = { vendorId, payoutId: null, vendorShareInr: { gt: 0 } };
  const [stays, packages, experiences] = await Promise.all([
    prisma.stayBooking.findMany({ where: { ...base, checkOutDate: { lte: upTo }, OR: settledClause(['checked_out', 'no_show']) }, select: SELECT }),
    prisma.packageBooking.findMany({ where: { ...base, endDate: { lte: upTo }, OR: settledClause(['completed']) }, select: SELECT }),
    prisma.experienceBooking.findMany({ where: { ...base, activityDate: { lte: upTo }, OR: settledClause(['completed', 'no_show']) }, select: SELECT }),
  ]);
  const map = (kind: Kind) => (b: (typeof stays)[number]): EligibleBooking => ({
    kind,
    bookingType: kind,
    bookingId: b.id,
    reference: b.bookingReference,
    taxableAmountInr: b.taxableAmountInr,
    commissionAmountInr: b.commissionAmountInr,
    vendorShareInr: b.vendorShareInr,
    createdAt: b.createdAt,
  });
  return [...stays.map(map('stay')), ...packages.map(map('package')), ...experiences.map(map('experience'))];
}

async function cutoffFor(requested?: string): Promise<string> {
  const cfg = await getPlatformConfig();
  const latestAllowed = addDays(todayIST(), -cfg.payoutRules.holdDaysAfterService);
  return requested && requested < latestAllowed ? requested : latestAllowed;
}

const idsOf = (lines: { bookingType: string; bookingId: string }[], kind: Kind) => lines.filter((l) => l.bookingType === kind).map((l) => l.bookingId);

const claim = (payoutId: string, vendorId: string, lines: EligibleBooking[]) =>
  Promise.all([
    prisma.stayBooking.updateMany({ where: { id: { in: idsOf(lines, 'stay') }, vendorId, payoutId: null }, data: { payoutId } }),
    prisma.packageBooking.updateMany({ where: { id: { in: idsOf(lines, 'package') }, vendorId, payoutId: null }, data: { payoutId } }),
    prisma.experienceBooking.updateMany({ where: { id: { in: idsOf(lines, 'experience') }, vendorId, payoutId: null }, data: { payoutId } }),
  ]);

const unclaimOps = (payoutId: string) => [
  prisma.stayBooking.updateMany({ where: { payoutId }, data: { payoutId: null } }),
  prisma.packageBooking.updateMany({ where: { payoutId }, data: { payoutId: null } }),
  prisma.experienceBooking.updateMany({ where: { payoutId }, data: { payoutId: null } }),
];

/* ───────────────────────────── vendor ───────────────────────────── */

/** What the vendor could withdraw right now (shown on the wallet screen). */
export async function previewPayout(vendorId: string) {
  const [vendor, cfg] = await Promise.all([prisma.vendor.findUniqueOrThrow({ where: { id: vendorId } }), getPlatformConfig()]);
  const cutoff = await cutoffFor();
  const eligible = await findEligible(vendorId, cutoff);
  const calc = computePayout(eligible, 0);
  return {
    wallet: {
      pendingClearanceBalanceInr: vendor.walletPendingInr,
      availablePayoutBalanceInr: vendor.walletAvailableInr,
      totalLifetimeEarningsInr: vendor.walletLifetimeEarningsInr,
      totalLifetimeCommissionPaidInr: vendor.walletLifetimeCommissionInr,
    },
    eligible: {
      bookings: eligible.length,
      grossBookingsAmountInr: calc.grossBookingsAmountInr,
      platformCommissionDeductedInr: calc.platformCommissionDeductedInr,
      tdsDeductedInr: 0,
      netPayableAmountInr: calc.netPayableAmountInr,
      cutoffServiceDate: cutoff,
    },
    rules: { minPayoutAmountInr: cfg.payoutRules.minPayoutAmountInr, holdDaysAfterService: cfg.payoutRules.holdDaysAfterService },
    bankVerified: !!vendor.banking?.isAccountVerified,
    banking: vendor.banking
      ? {
          accountHolderName: vendor.banking.accountHolderName,
          accountNumberLast4: vendor.banking.accountNumberLast4,
          bankName: vendor.banking.bankName,
          ifscCode: vendor.banking.ifscCode,
          isAccountVerified: vendor.banking.isAccountVerified,
        }
      : null,
  };
}

export async function requestPayout(vendorId: string, input: { upTo?: string; amountInr?: number }, req: Pick<Request, 'ip' | 'get'>) {
  return lockService.withLock(`payout:${vendorId}`, async () => {
    const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id: vendorId } });
    if (!vendor.banking || !vendor.banking.accountNumberLast4) {
      throw ApiError.badRequest('Add your bank account before requesting a payout.', 'BANK_NOT_CONFIGURED');
    }
    const cfg = await getPlatformConfig();
    const minPayout = cfg.payoutRules.minPayoutAmountInr || 500;
    const eligible = await findEligible(vendorId, await cutoffFor(input.upTo));

    let grossBookingsAmountInr = 0;
    let vendorShareTotalInr = 0;
    let platformCommissionDeductedInr = 0;
    let lines: any[] = [];

    if (eligible.length > 0) {
      const calc = computePayout(eligible, 0);
      grossBookingsAmountInr = calc.grossBookingsAmountInr;
      vendorShareTotalInr = calc.vendorShareTotalInr;
      platformCommissionDeductedInr = calc.platformCommissionDeductedInr;
      lines = calc.lines;
    } else {
      const available = vendor.walletAvailableInr || 0;
      if (available <= 0) {
        throw ApiError.conflict('No settled bookings or wallet funds are available for payout yet.', 'NOTHING_TO_PAY');
      }
      const requestedAmt = input.amountInr && input.amountInr > 0 ? Math.min(input.amountInr, available) : available;
      if (requestedAmt < minPayout && available >= minPayout) {
        throw ApiError.conflict(`The minimum payout is ₹${minPayout}.`, 'BELOW_MINIMUM_PAYOUT');
      }
      vendorShareTotalInr = requestedAmt;
      grossBookingsAmountInr = requestedAmt;
      platformCommissionDeductedInr = 0;
    }

    const withdrawAmount = Math.min(vendorShareTotalInr, vendor.walletAvailableInr);
    if (withdrawAmount <= 0) {
      throw ApiError.conflict('Insufficient available wallet balance for payout.', 'INSUFFICIENT_BALANCE');
    }

    const payoutId = randomObjectId();
    if (eligible.length > 0) {
      const claimed = (await claim(payoutId, vendorId, eligible)).reduce((s, r) => s + r.count, 0);
      if (claimed !== eligible.length) {
        await prisma.$transaction(unclaimOps(payoutId));
        throw ApiError.conflict('Another payout request is in progress. Please retry in a moment.', 'PAYOUT_IN_PROGRESS');
      }
    }

    const created = await runGuarded([
      // guard: the wallet must really hold this money
      prisma.vendor.update({ where: { id: vendorId, walletAvailableInr: { gte: withdrawAmount } }, data: { walletAvailableInr: { decrement: withdrawAmount } } }),
      prisma.vendorPayout.create({
        data: {
          id: payoutId,
          payoutReference: await generatePayoutReference(),
          vendorId,
          periodFrom: eligible.length > 0 ? new Date(Math.min(...eligible.map((b) => b.createdAt.getTime()))) : new Date(),
          periodTo: new Date(),
          lines,
          grossBookingsAmountInr,
          vendorShareTotalInr: withdrawAmount,
          platformCommissionDeductedInr,
          tdsRatePercent: 0,
          tdsDeductedInr: 0,
          netPayableAmountInr: withdrawAmount,
          bank: {
            accountHolderName: vendor.banking.accountHolderName,
            accountNumberEnc: vendor.banking.accountNumberEnc,
            accountNumberLast4: vendor.banking.accountNumberLast4,
            ifscCode: vendor.banking.ifscCode,
            bankName: vendor.banking.bankName,
          },
          status: 'requested',
        },
      }),
    ]);
    if (!created) {
      if (eligible.length > 0) await prisma.$transaction(unclaimOps(payoutId));
      throw ApiError.conflict('Your wallet balance changed. Please refresh and try again.', 'WALLET_CHANGED');
    }

    const payout = await prisma.vendorPayout.findUniqueOrThrow({ where: { id: payoutId } });
    await audit({ actor: { id: vendorId, role: 'vendor' }, action: 'REQUEST_PAYOUT', targetEntity: 'VendorPayout', targetId: payoutId, newState: { net: payout.netPayableAmountInr, bookings: eligible.length }, req });
    return presentPayout(payout);
  });
}

export async function listPayouts(q: PaginationInput & { status?: Prisma.VendorPayoutWhereInput['status']; vendorId?: string }, opts: { revealAccount?: boolean } = {}) {
  const where: Prisma.VendorPayoutWhereInput = { ...(q.status ? { status: q.status } : {}), ...(q.vendorId ? { vendorId: q.vendorId } : {}) };
  const [total, rows] = await Promise.all([
    prisma.vendorPayout.count({ where }),
    prisma.vendorPayout.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(q) }),
  ]);
  const vendorIds = Array.from(new Set(rows.map((r) => r.vendorId)));
  const vendors = await prisma.vendor.findMany({
    where: { id: { in: vendorIds } },
    select: { id: true, displayName: true, businessName: true, email: true },
  });
  const vendorMap = new Map(vendors.map((v) => [v.id, v.displayName || v.businessName || 'Vendor Partner']));
  return {
    items: rows.map((p) => ({
      ...presentPayout(p, opts),
      vendorName: vendorMap.get(p.vendorId) || 'Vendor Partner',
    })),
    meta: pageMeta(q, total),
  };
}

export async function getPayout(id: string, opts: { vendorId?: string; revealAccount?: boolean } = {}) {
  const p = await prisma.vendorPayout.findFirst({ where: { id, ...(opts.vendorId ? { vendorId: opts.vendorId } : {}) } });
  if (!p) throw ApiError.notFound('Payout');
  return presentPayout(p, opts);
}

/* ───────────────────────────── staff workflow ───────────────────────────── */

const conflictState = () => ApiError.conflict('This payout is not in a state that allows this action', 'INVALID_STATE');

/** Step 1 (Admin): verify the lines and amounts. */
export async function auditPayout(payoutId: string, staff: StaffContext, notes: string | undefined, req: Pick<Request, 'ip' | 'get'>) {
  const res = await prisma.vendorPayout.updateMany({
    where: { id: payoutId, status: 'requested' },
    data: { status: 'audited_by_admin', auditedByAdminId: staff.id, auditedAt: new Date(), notes },
  });
  if (res.count === 0) throw conflictState();
  await audit({ actor: { id: staff.id, role: staff.role }, action: 'AUDIT_PAYOUT', targetEntity: 'VendorPayout', targetId: payoutId, newState: { notes }, req });
  return getPayout(payoutId);
}

/**
 * Step 2 (Super-Admin, master PIN): authorise the transfer. If the UTR is already known the payout completes in
 * the same step; otherwise call `completePayout` once the bank confirms.
 */
export async function releasePayout(
  payoutId: string,
  staff: StaffContext,
  input: { transferMethod: TransferMethod; utrNumber?: string },
  req: Pick<Request, 'ip' | 'get'>,
) {
  const p = await prisma.vendorPayout.findUnique({ where: { id: payoutId } });
  if (!p) throw ApiError.notFound('Payout');
  const now = new Date();
  const data = input.utrNumber
    ? { status: 'completed' as const, transferMethod: input.transferMethod, utrNumber: input.utrNumber, approvedBySuperAdminId: staff.id, releasedAt: now, completedAt: now }
    : { status: 'released_by_superadmin' as const, transferMethod: input.transferMethod, approvedBySuperAdminId: staff.id, releasedAt: now };

  const ok = await runGuarded([
    prisma.vendorPayout.update({ where: { id: payoutId, status: 'audited_by_admin' }, data }),
    ...(input.utrNumber ? [lifetimeTotals(p.vendorId, p.netPayableAmountInr, p.platformCommissionDeductedInr)] : []),
  ]);
  if (!ok) throw ApiError.conflict('The payout must be audited by an admin before it can be released', 'NOT_AUDITED');
  await audit({ actor: { id: staff.id, role: staff.role }, action: 'RELEASE_PAYOUT', targetEntity: 'VendorPayout', targetId: payoutId, newState: { ...input, net: p.netPayableAmountInr }, req });
  if (input.utrNumber) void notifyVendor(p.vendorId, p.payoutReference, 'completed', p.netPayableAmountInr);
  return getPayout(payoutId, { revealAccount: true });
}

const lifetimeTotals = (vendorId: string, net: number, commission: number) =>
  prisma.vendor.update({ where: { id: vendorId }, data: { walletLifetimeEarningsInr: { increment: net }, walletLifetimeCommissionInr: { increment: commission } } });

/** Step 3: bank transfer done → record the UTR. */
export async function completePayout(payoutId: string, staff: StaffContext, utrNumber: string, req: Pick<Request, 'ip' | 'get'>) {
  const p = await prisma.vendorPayout.findUnique({ where: { id: payoutId } });
  if (!p) throw ApiError.notFound('Payout');
  const ok = await runGuarded([
    prisma.vendorPayout.update({ where: { id: payoutId, status: 'released_by_superadmin' }, data: { status: 'completed', utrNumber, completedAt: new Date() } }),
    lifetimeTotals(p.vendorId, p.netPayableAmountInr, p.platformCommissionDeductedInr),
  ]);
  if (!ok) throw conflictState();
  await audit({ actor: { id: staff.id, role: staff.role }, action: 'COMPLETE_PAYOUT', targetEntity: 'VendorPayout', targetId: payoutId, newState: { utrNumber }, req });
  void notifyVendor(p.vendorId, p.payoutReference, 'completed', p.netPayableAmountInr);
  return getPayout(payoutId, { revealAccount: true });
}

/** Direct Admin/SuperAdmin settlement completion with transaction number (UTR) & transfer method */
export async function adminCompletePayout(
  payoutId: string,
  staff: StaffContext,
  input: { utrNumber: string; transferMethod?: TransferMethod; notes?: string },
  req: Pick<Request, 'ip' | 'get'>
) {
  const p = await prisma.vendorPayout.findUnique({ where: { id: payoutId } });
  if (!p) throw ApiError.notFound('Payout');
  if (p.status === 'completed') {
    throw ApiError.conflict('Payout is already marked as completed', 'ALREADY_COMPLETED');
  }

  const now = new Date();
  const method: TransferMethod = input.transferMethod || 'NEFT';

  const ok = await runGuarded([
    prisma.vendorPayout.update({
      where: { id: payoutId, status: { in: ['requested', 'audited_by_admin', 'released_by_superadmin'] } },
      data: {
        status: 'completed',
        transferMethod: method,
        utrNumber: input.utrNumber,
        notes: input.notes || p.notes,
        approvedBySuperAdminId: staff.id,
        releasedAt: p.releasedAt || now,
        completedAt: now,
      },
    }),
    lifetimeTotals(p.vendorId, p.netPayableAmountInr, p.platformCommissionDeductedInr),
  ]);
  if (!ok) throw conflictState();

  // If vendor has banking, mark isAccountVerified true
  const v = await prisma.vendor.findUnique({ where: { id: p.vendorId }, select: { banking: true } });
  if (v?.banking && !v.banking.isAccountVerified) {
    await prisma.vendor.update({
      where: { id: p.vendorId },
      data: {
        banking: {
          set: {
            ...v.banking,
            isAccountVerified: true,
          },
        },
      },
    });
  }

  await audit({
    actor: { id: staff.id, role: staff.role },
    action: 'COMPLETE_PAYOUT',
    targetEntity: 'VendorPayout',
    targetId: payoutId,
    newState: { utrNumber: input.utrNumber, transferMethod: method, net: p.netPayableAmountInr },
    req,
  });
  void notifyVendor(p.vendorId, p.payoutReference, 'completed', p.netPayableAmountInr);
  return getPayout(payoutId, { revealAccount: true });
}

/** Rejects / fails a payout: bookings become payable again and the money returns to the vendor's wallet. */
export async function failPayout(payoutId: string, staff: StaffContext, reason: string, req: Pick<Request, 'ip' | 'get'>) {
  const p = await prisma.vendorPayout.findUnique({ where: { id: payoutId } });
  if (!p) throw ApiError.notFound('Payout');
  const ok = await runGuarded([
    prisma.vendorPayout.update({
      where: { id: payoutId, status: { in: ['requested', 'audited_by_admin', 'released_by_superadmin'] } },
      data: { status: 'failed', failureReason: reason },
    }),
    prisma.vendor.update({ where: { id: p.vendorId }, data: { walletAvailableInr: { increment: p.vendorShareTotalInr } } }),
    ...unclaimOps(payoutId),
  ]);
  if (!ok) throw conflictState();
  await audit({ actor: { id: staff.id, role: staff.role }, action: 'FAIL_PAYOUT', targetEntity: 'VendorPayout', targetId: payoutId, newState: { reason }, req });
  void notifyVendor(p.vendorId, p.payoutReference, 'failed', p.netPayableAmountInr, reason);
  return getPayout(payoutId);
}

async function notifyVendor(vendorId: string, reference: string, outcome: 'completed' | 'failed', netInr: number, reason?: string) {
  const v = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { email: true, displayName: true } });
  if (!v) return;
  await sendEmail({
    to: v.email,
    subject: `Payout ${reference} ${outcome === 'completed' ? 'paid' : 'could not be processed'}`,
    html: `<p>Hi ${v.displayName.replace(/[<>&]/g, '')},</p><p>${outcome === 'completed' ? `Your payout <b>${reference}</b> of ₹${netInr} has been transferred.` : `Your payout <b>${reference}</b> could not be processed${reason ? `: ${reason.replace(/[<>&]/g, '')}` : ''}. The amount is back in your wallet.`}</p>`,
  });
}
