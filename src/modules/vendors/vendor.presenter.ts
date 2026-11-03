import type { Vendor } from '@prisma/client';
import { decrypt } from '../../utils/crypto';

export type BankVisibility = 'hidden' | 'masked' | 'full';

/** API shape of the spec's `IVendor` (secrets removed, wallet re-nested, bank number masked). */
export function presentVendor(v: Vendor, opts: { bank?: BankVisibility } = {}) {
  const bank = opts.bank ?? 'masked';
  const banking =
    v.banking && bank !== 'hidden'
      ? {
          accountHolderName: v.banking.accountHolderName,
          bankName: v.banking.bankName,
          ifscCode: v.banking.ifscCode,
          branchName: v.banking.branchName,
          upiId: v.banking.upiId,
          isAccountVerified: v.banking.isAccountVerified,
          accountNumberMasked: `XXXXXX${v.banking.accountNumberLast4}`,
          ...(bank === 'full' ? { accountNumber: decrypt(v.banking.accountNumberEnc) } : {}),
        }
      : null;

  return {
    id: v.id,
    _id: v.id,
    vendorCode: v.vendorCode,
    businessType: v.businessType,
    category: v.category,
    businessName: v.businessName,
    displayName: v.displayName,
    displayRole: v.displayRole,
    experienceSummary: v.experienceSummary,
    avatarUrl: v.avatarUrl,
    email: v.email,
    phone: v.phone,
    contact: { ...v.contact, email: v.email, phone: v.phone },
    compliance: v.compliance,
    banking,
    commissionTerms: v.commissionTerms,
    wallet: {
      pendingClearanceBalanceInr: v.walletPendingInr,
      availablePayoutBalanceInr: v.walletAvailableInr,
      totalLifetimeEarningsInr: v.walletLifetimeEarningsInr,
      totalLifetimeCommissionPaidInr: v.walletLifetimeCommissionInr,
    },
    status: v.status,
    lastLoginAt: v.lastLoginAt,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

/** What travellers see on listing pages. */
export function presentVendorPublic(v: Pick<Vendor, 'id' | 'displayName' | 'displayRole' | 'experienceSummary' | 'avatarUrl'>) {
  return {
    id: v.id,
    displayName: v.displayName,
    displayRole: v.displayRole,
    experienceSummary: v.experienceSummary,
    avatarUrl: v.avatarUrl,
  };
}
