import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { getStaff, requireStaff } from '../../middlewares/staff';
import { requireMasterPin } from '../../middlewares/masterPin';
import { sensitiveLimiter } from '../../middlewares/rateLimiter';
import { audit } from '../../services/audit.service';
import { getPlatformConfig, updatePlatformConfig } from '../../services/platformConfig.service';
import { ok } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { hashPassword, verifyPassword } from '../../utils/crypto';
import { pageMeta, paginationSchema, skipTake } from '../../utils/pagination';
import * as v from '../../utils/zod';
import { completePayoutSchema, failPayoutSchema, payoutListQuery, releasePayoutSchema } from '../payouts/payout.schemas';
import { completePayout, failPayout, getPayout, listPayouts, releasePayout } from '../payouts/payout.service';
import { presentVendor } from '../vendors/vendor.presenter';
import { platformDashboard } from './dashboard.admin';
import { makeAdminsRouter, makeSubAdminRouter } from './staff.admin';

/** Everything under /api/v1/superadmin — platform owner only. Money- and policy-changing calls also need the master PIN. */
export const superAdminRouter = Router();

const sa = requireStaff({}); // no admin / sub_admin rule → only the super-admin passes
const pin = requireMasterPin();

const pct = z.number().min(0).max(100);
const configPatchSchema = z
  .object({
    gstRates: z.object({ staysStandardGstPercent: pct, packagesGstPercent: pct, experiencesGstPercent: pct }).partial(),
    platformFees: z
      .object({ defaultCleaningFeeRatePercent: pct, defaultGearInsuranceFeeRatePercent: pct, clubMemberDiscountPercent: pct, packageChildPricePercent: pct, experienceChildPricePercent: pct })
      .partial(),
    cancellationWindowRules: z.object({ defaultFreeCancellationHours: z.number().int().min(0).max(24 * 60), lateCancellationFeePercent: pct }).partial(),
    defaultCommission: z
      .object({ propertyCommissionRatePercent: pct, packageCommissionRatePercent: pct, experienceCommissionRatePercent: pct, payoutCycle: z.enum(['weekly', 'biweekly', 'monthly']) })
      .partial(),
    payoutRules: z.object({ tdsRatePercent: pct, minPayoutAmountInr: z.number().int().min(0).max(10_000_000), holdDaysAfterService: z.number().int().min(0).max(90) }).partial(),
    dynamicPricing: z.object({ enabled: z.boolean(), holidayDates: z.array(v.isoDate).max(400) }).partial(),
  })
  .partial()
  .refine((p) => Object.keys(p).length > 0, { message: 'Provide at least one section to update' });

/* ── dashboard ── */
superAdminRouter.get('/dashboard', sa, async (_req, res) => {
  const [platform, liabilities] = await Promise.all([
    platformDashboard(),
    prisma.vendor.aggregate({ _sum: { walletPendingInr: true, walletAvailableInr: true, walletLifetimeEarningsInr: true, walletLifetimeCommissionInr: true } }),
  ]);
  ok(res, {
    ...platform,
    vendorWallets: {
      pendingClearanceInr: liabilities._sum.walletPendingInr ?? 0,
      availableForPayoutInr: liabilities._sum.walletAvailableInr ?? 0,
      lifetimeEarningsInr: liabilities._sum.walletLifetimeEarningsInr ?? 0,
      lifetimeCommissionInr: liabilities._sum.walletLifetimeCommissionInr ?? 0,
    },
  });
});

/* ── platform configuration: GST, fees, cancellation rules, commissions, payout rules ── */
superAdminRouter.get('/config', sa, async (_req, res) => {
  ok(res, await getPlatformConfig());
});

superAdminRouter.put('/config', sa, pin, async (req, res) => {
  const staff = getStaff(req);
  const patch = configPatchSchema.parse(v.bodyOf(req));
  const { before, after } = await updatePlatformConfig(patch, staff.id);
  await audit({ actor: { id: staff.id, role: 'super_admin' }, action: 'UPDATE_PLATFORM_CONFIG', targetEntity: 'PlatformConfig', targetId: after.id, previousState: before, newState: after, req });
  ok(res, after);
});

/* ── per-vendor commission terms (applies to FUTURE bookings; existing bookings keep their snapshot) ── */
superAdminRouter.put('/vendors/:id/commission', sa, pin, async (req, res) => {
  const staff = getStaff(req);
  const id = v.objectId.parse(req.params.id);
  const input = z
    .object({
      commissionType: z.enum(['percentage', 'fixed']),
      propertyCommissionRatePercent: z.number().min(0).max(100_000),
      packageCommissionRatePercent: z.number().min(0).max(100_000),
      experienceCommissionRatePercent: z.number().min(0).max(100_000),
      payoutCycle: z.enum(['weekly', 'biweekly', 'monthly']),
    })
    .partial()
    .refine((b) => Object.keys(b).length > 0, { message: 'Provide at least one field to update' })
    .parse(v.bodyOf(req));
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw ApiError.notFound('Vendor');
  const merged = { ...vendor.commissionTerms, ...input };
  if (merged.commissionType === 'percentage' && [merged.propertyCommissionRatePercent, merged.packageCommissionRatePercent, merged.experienceCommissionRatePercent].some((r) => r > 100)) {
    throw ApiError.unprocessable('Percentage commissions cannot exceed 100', undefined, 'INVALID_COMMISSION');
  }
  const updated = await prisma.vendor.update({ where: { id }, data: { commissionTerms: { set: merged } } });
  await audit({ actor: { id: staff.id, role: 'super_admin' }, action: 'UPDATE_VENDOR_COMMISSION', targetEntity: 'Vendor', targetId: id, previousState: vendor.commissionTerms, newState: merged, req });
  ok(res, presentVendor(updated).commissionTerms);
});

/* ── payouts: list / release / complete / fail ── */
superAdminRouter.get('/finance/payouts', sa, async (req, res) => {
  const { items, meta } = await listPayouts(payoutListQuery.parse(req.query));
  ok(res, items, meta);
});

/** Full (decrypted) bank details are needed to make the transfer — every reveal is audited. */
superAdminRouter.get('/finance/payouts/:id', sa, async (req, res) => {
  const staff = getStaff(req);
  const id = v.objectId.parse(req.params.id);
  const payout = await getPayout(id, { revealAccount: true });
  await audit({ actor: { id: staff.id, role: 'super_admin' }, action: 'VIEW_PAYOUT_BANK_DETAILS', targetEntity: 'VendorPayout', targetId: id, req });
  ok(res, payout);
});

superAdminRouter.post('/finance/payouts/release', sa, pin, sensitiveLimiter, async (req, res) => {
  const { payoutId, transferMethod, utrNumber } = releasePayoutSchema.parse(v.bodyOf(req));
  ok(res, await releasePayout(payoutId, getStaff(req), { transferMethod, utrNumber }, req));
});

superAdminRouter.post('/finance/payouts/:id/complete', sa, pin, sensitiveLimiter, async (req, res) => {
  ok(res, await completePayout(v.objectId.parse(req.params.id), getStaff(req), completePayoutSchema.parse(v.bodyOf(req)).utrNumber, req));
});

superAdminRouter.post('/finance/payouts/:id/fail', sa, pin, sensitiveLimiter, async (req, res) => {
  ok(res, await failPayout(v.objectId.parse(req.params.id), getStaff(req), failPayoutSchema.parse(v.bodyOf(req)).reason, req));
});

/* ── immutable audit trail ── */
superAdminRouter.get('/audit-logs', sa, async (req, res) => {
  const q = paginationSchema
    .extend({
      actorId: v.objectId.optional(),
      actorRole: z.enum(['user', 'vendor', 'sub_admin', 'admin', 'super_admin', 'system']).optional(),
      action: z.string().trim().max(80).optional(),
      targetEntity: z.string().trim().max(60).optional(),
      targetId: z.string().trim().max(40).optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .parse(req.query);
  const where = {
    ...(q.actorId ? { actorId: q.actorId } : {}),
    ...(q.actorRole ? { actorRole: q.actorRole } : {}),
    ...(q.action ? { action: q.action } : {}),
    ...(q.targetEntity ? { targetEntity: q.targetEntity } : {}),
    ...(q.targetId ? { targetId: q.targetId } : {}),
    ...(q.from || q.to ? { createdAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } } : {}),
  };
  const [total, rows] = await Promise.all([prisma.auditLog.count({ where }), prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(q) })]);
  ok(res, rows, pageMeta(q, total));
});

/* ── master PIN ── */
superAdminRouter.post('/master-pin/change', sa, sensitiveLimiter, async (req, res) => {
  const staff = getStaff(req);
  const { currentPin, newPin } = z.object({ currentPin: z.string().min(4).max(32), newPin: z.string().regex(/^\d{6,12}$/, 'The master PIN must be 6-12 digits') }).parse(v.bodyOf(req));
  const me = await prisma.superAdmin.findUniqueOrThrow({ where: { id: staff.id }, select: { masterPinHash: true } });
  if (!(await verifyPassword(currentPin, me.masterPinHash))) throw ApiError.forbidden('Current master PIN is incorrect', 'MASTER_PIN_INVALID');
  await prisma.superAdmin.update({ where: { id: staff.id }, data: { masterPinHash: await hashPassword(newPin) } });
  await audit({ actor: { id: staff.id, role: 'super_admin' }, action: 'CHANGE_MASTER_PIN', targetEntity: 'SuperAdmin', targetId: staff.id, req });
  ok(res, { changed: true });
});

/* ── staff management ── */
superAdminRouter.use('/subadmins', makeSubAdminRouter(sa));
superAdminRouter.use('/admins', makeAdminsRouter(sa));
