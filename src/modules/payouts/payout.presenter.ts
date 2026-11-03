import type { VendorPayout } from '@prisma/client';
import { decrypt } from '../../utils/crypto';

export function presentPayout(p: VendorPayout, opts: { revealAccount?: boolean } = {}) {
  return {
    id: p.id,
    _id: p.id,
    payoutReference: p.payoutReference,
    vendorId: p.vendorId,
    settlementPeriod: { from: p.periodFrom, to: p.periodTo },
    bookingsIncluded: p.lines.map((l) => l.bookingId),
    lines: p.lines,
    grossBookingsAmountInr: p.grossBookingsAmountInr,
    platformCommissionDeductedInr: p.platformCommissionDeductedInr,
    tdsRatePercent: p.tdsRatePercent,
    tdsDeductedInr: p.tdsDeductedInr,
    netPayableAmountInr: p.netPayableAmountInr,
    bankTransferDetails: {
      accountHolderName: p.bank.accountHolderName,
      accountNumber: opts.revealAccount ? decrypt(p.bank.accountNumberEnc) : `XXXXXX${p.bank.accountNumberLast4}`,
      ifscCode: p.bank.ifscCode,
      bankName: p.bank.bankName,
      utrNumber: p.utrNumber,
      transferMethod: p.transferMethod,
    },
    status: p.status,
    notes: p.notes,
    failureReason: p.failureReason,
    auditedByAdminId: p.auditedByAdminId,
    auditedAt: p.auditedAt,
    approvedBySuperAdminId: p.approvedBySuperAdminId,
    releasedAt: p.releasedAt,
    completedAt: p.completedAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
