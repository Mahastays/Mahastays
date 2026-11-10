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
    isApproved: vendor.status === 'active' || vendor.compliance.verificationStatus === 'approved',
  };
}

/** Any non-blacklisted vendor (pending vendors can still finish onboarding). */
export const requireVendor = (): RequestHandler =>
  tagAccess(
    chain(authenticate, async (req, _res, next) => {
      if (req.auth?.role !== 'vendor') {
        // Staff roles (admin, super_admin, sub_admin) acting on vendor routes
        if (req.auth && ['admin', 'super_admin', 'sub_admin'].includes(req.auth.role)) {
          const bodyVendorId = (req.body as any)?.vendorId || (req.query as any)?.vendorId;
          let targetVendor = null;
          if (bodyVendorId) {
            const isHex24 = /^[a-f\d]{24}$/i.test(bodyVendorId);
            if (isHex24) {
              targetVendor = await prisma.vendor.findUnique({ where: { id: bodyVendorId } }).catch(() => null);
            }
            if (!targetVendor) {
              targetVendor = await prisma.vendor.findFirst({ where: { vendorCode: bodyVendorId } }).catch(() => null);
            }
          }
          if (!targetVendor) {
            targetVendor = (await prisma.vendor.findFirst({ where: { status: 'active' } })) || (await prisma.vendor.findFirst());
          }
          if (targetVendor) {
            req.vendor = {
              id: targetVendor.id,
              status: targetVendor.status,
              isApproved: true,
            };
            return next();
          }
        }
        throw ApiError.forbidden();
      }
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
