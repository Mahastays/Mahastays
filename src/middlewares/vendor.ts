import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import type { VendorContext } from '../types/auth';
import { authenticate } from './authenticate';
import { tagAccess } from './access';
import { chain } from './chain';

async function loadVendor(id: string): Promise<VendorContext> {
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    select: { id: true, status: true, compliance: { select: { verificationStatus: true } } },
  });
  if (!vendor) throw ApiError.unauthorized('Vendor account not found');
  if (vendor.status === 'blacklisted') throw ApiError.forbidden('This vendor account has been blacklisted', 'VENDOR_BLACKLISTED');
  return {
    id: vendor.id,
    status: vendor.status,
    isApproved: vendor.status === 'active' && vendor.compliance.verificationStatus === 'approved',
  };
}

/** Any non-blacklisted vendor (pending vendors can still finish onboarding). */
export const requireVendor = (): RequestHandler =>
  tagAccess(
    chain(authenticate, async (req, _res, next) => {
      if (req.auth?.role !== 'vendor') throw ApiError.forbidden();
      req.vendor = await loadVendor(req.auth.id);
      next();
    }),
    'vendor',
  );

/** Vendor whose KYC is approved and whose account is active (may publish listings, request payouts). */
export const requireApprovedVendor = (): RequestHandler =>
  tagAccess(
    chain(requireVendor(), (req, _res, next) => {
      if (!req.vendor?.isApproved) {
        throw ApiError.forbidden('Your vendor account is not approved yet or is on hold.', 'VENDOR_NOT_APPROVED');
      }
      next();
    }),
    'vendor (KYC-approved)',
  );

export function getVendor(req: { vendor?: VendorContext }): VendorContext {
  if (!req.vendor) throw ApiError.unauthorized();
  return req.vendor;
}
