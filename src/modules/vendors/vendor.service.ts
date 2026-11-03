import type { Request } from 'express';
import { prisma } from '../../lib/prisma';
import { audit } from '../../services/audit.service';
import { ApiError } from '../../utils/ApiError';
import { encrypt } from '../../utils/crypto';
import { todayIST } from '../../utils/dates';
import { last4 } from '../../utils/masking';
import { presentVendor } from './vendor.presenter';
import type { BankingInput, SubmitKycInput, UpdateVendorProfileInput } from './vendor.schemas';

export async function getVendorMe(id: string) {
  const v = await prisma.vendor.findUnique({ where: { id } });
  if (!v) throw ApiError.notFound('Vendor');
  return presentVendor(v);
}

export async function updateVendorProfile(id: string, input: UpdateVendorProfileInput) {
  const current = await prisma.vendor.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.vendor.update({
    where: { id },
    data: {
      businessName: input.businessName,
      displayName: input.displayName,
      displayRole: input.displayRole,
      experienceSummary: input.experienceSummary,
      avatarUrl: input.avatarUrl,
      phone: input.phone,
      ...(input.contact ? { contact: { set: { ...current.contact, ...input.contact } } } : {}),
    },
  });
  return presentVendor(updated);
}

/** Submit (or resubmit after rejection) legal details and KYC documents for admin review. */
export async function submitKyc(id: string, input: SubmitKycInput, req: Pick<Request, 'ip' | 'get'>) {
  const v = await prisma.vendor.findUniqueOrThrow({ where: { id } });
  const status = v.compliance.verificationStatus;
  if (status === 'under_review') throw ApiError.conflict('Your documents are already under review.', 'KYC_UNDER_REVIEW');
  if (status === 'approved') throw ApiError.conflict('KYC is already approved. Contact support to change legal details.', 'KYC_APPROVED');
  const updated = await prisma.vendor.update({
    where: { id },
    data: {
      compliance: {
        set: {
          ...v.compliance,
          panNumber: input.panNumber,
          gstin: input.gstin ?? null,
          tourismLicenseNumber: input.tourismLicenseNumber ?? null,
          identityProofUrl: input.identityProofUrl,
          businessProofUrl: input.businessProofUrl,
          verificationStatus: 'under_review',
          rejectionReason: null,
        },
      },
    },
  });
  await audit({ actor: { id, role: 'vendor' }, action: 'SUBMIT_KYC', targetEntity: 'Vendor', targetId: id, req });
  return presentVendor(updated);
}

/** Account numbers are encrypted at rest (AES-256-GCM); any change resets bank verification. */
export async function saveBanking(id: string, input: BankingInput, req: Pick<Request, 'ip' | 'get'>) {
  const v = await prisma.vendor.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.vendor.update({
    where: { id },
    data: {
      banking: {
        set: {
          accountHolderName: input.accountHolderName,
          accountNumberEnc: encrypt(input.accountNumber),
          accountNumberLast4: last4(input.accountNumber),
          bankName: input.bankName,
          ifscCode: input.ifscCode,
          branchName: input.branchName ?? null,
          upiId: input.upiId ?? null,
          isAccountVerified: false,
        },
      },
    },
  });
  await audit({
    actor: { id, role: 'vendor' },
    action: v.banking ? 'CHANGE_BANK_ACCOUNT' : 'ADD_BANK_ACCOUNT',
    targetEntity: 'Vendor',
    targetId: id,
    previousState: v.banking ? { last4: v.banking.accountNumberLast4, ifsc: v.banking.ifscCode, wasVerified: v.banking.isAccountVerified } : undefined,
    newState: { last4: last4(input.accountNumber), ifsc: input.ifscCode },
    req,
  });
  return presentVendor(updated).banking;
}

/** Numbers for the vendor home screen. */
export async function dashboard(vendorId: string) {
  const today = todayIST();
  const since = new Date(Date.now() - 30 * 86_400_000);
  const v = await prisma.vendor.findUniqueOrThrow({ where: { id: vendorId } });

  const [props, pkgs, exps] = await Promise.all([
    prisma.property.groupBy({ by: ['status'], where: { vendorId }, _count: { _all: true } }),
    prisma.package.groupBy({ by: ['status'], where: { vendorId }, _count: { _all: true } }),
    prisma.experience.groupBy({ by: ['status'], where: { vendorId }, _count: { _all: true } }),
  ]);
  const tally = (rows: { status: string; _count: { _all: number } }[]) => Object.fromEntries(rows.map((r) => [r.status, r._count._all]));

  const paid = { vendorId, confirmedAt: { gte: since }, paymentStatus: { in: ['paid' as const, 'partially_refunded' as const] } };
  const [stayEarn, pkgEarn, expEarn, arrivals, upcomingStays, upcomingPackages, activitiesToday, pendingHolds, openPayouts] = await Promise.all([
    prisma.stayBooking.aggregate({ where: paid, _sum: { vendorShareInr: true, grandTotalInr: true }, _count: { _all: true } }),
    prisma.packageBooking.aggregate({ where: paid, _sum: { vendorShareInr: true, grandTotalInr: true }, _count: { _all: true } }),
    prisma.experienceBooking.aggregate({ where: paid, _sum: { vendorShareInr: true, grandTotalInr: true }, _count: { _all: true } }),
    prisma.stayBooking.count({ where: { vendorId, bookingStatus: 'confirmed', checkInDate: today } }),
    prisma.stayBooking.count({ where: { vendorId, bookingStatus: 'confirmed', checkInDate: { gt: today } } }),
    prisma.packageBooking.count({ where: { vendorId, bookingStatus: 'confirmed', endDate: { gte: today } } }),
    prisma.experienceBooking.count({ where: { vendorId, bookingStatus: { in: ['reserved', 'checked_in'] }, activityDate: today } }),
    prisma.stayBooking.count({ where: { vendorId, bookingStatus: 'pending', holdExpiresAt: { gt: new Date() } } }),
    prisma.vendorPayout.count({ where: { vendorId, status: { in: ['requested', 'audited_by_admin', 'released_by_superadmin'] } } }),
  ]);
  const sum = (a: { _sum: { vendorShareInr: number | null; grandTotalInr: number | null }; _count: { _all: number } }) => ({ vendorShare: a._sum.vendorShareInr ?? 0, gross: a._sum.grandTotalInr ?? 0, bookings: a._count._all });
  const [s, p, e] = [sum(stayEarn), sum(pkgEarn), sum(expEarn)];

  return {
    status: v.status,
    verificationStatus: v.compliance.verificationStatus,
    listings: { properties: tally(props), packages: tally(pkgs), experiences: tally(exps) },
    today: { date: today, stayArrivals: arrivals, activitiesToday },
    upcoming: { stays: upcomingStays, packages: upcomingPackages, unpaidHolds: pendingHolds },
    last30Days: {
      bookings: s.bookings + p.bookings + e.bookings,
      grossInr: s.gross + p.gross + e.gross,
      earningsAfterCommissionInr: s.vendorShare + p.vendorShare + e.vendorShare,
      byType: { stays: s, packages: p, experiences: e },
    },
    wallet: {
      pendingClearanceBalanceInr: v.walletPendingInr,
      availablePayoutBalanceInr: v.walletAvailableInr,
      totalLifetimeEarningsInr: v.walletLifetimeEarningsInr,
      totalLifetimeCommissionPaidInr: v.walletLifetimeCommissionInr,
    },
    openPayouts,
  };
}
