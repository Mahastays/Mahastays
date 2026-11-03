import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middlewares/authenticate';
import { requireStaff, getStaff } from '../../middlewares/staff';
import { audit } from '../../services/audit.service';
import { calculateCouponDiscount, resolveCoupon } from '../../services/coupon.service';
import { created, ok } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { pageMeta, paginationSchema, skipTake } from '../../utils/pagination';
import { bodyOf, objectId } from '../../utils/zod';

export const couponRouter = Router();
export const adminCouponRouter = Router();

const validateCouponBody = z.object({
  code: z.string().min(2).max(40),
  bookingType: z.enum(['stay', 'package', 'experience']),
  amount: z.number().positive(),
});

/**
 * POST /coupons/validate — preview coupon discount against cart amount
 */
couponRouter.post('/validate', authenticate, async (req, res) => {
  const { code, bookingType, amount } = validateCouponBody.parse(bodyOf(req));
  const resolved = await resolveCoupon(code, req.auth?.role === 'user' ? req.auth.id : null, bookingType, amount);
  if (!resolved) throw ApiError.badRequest('Invalid coupon code');
  const discountInr = calculateCouponDiscount(resolved.input, amount);
  ok(res, {
    code: resolved.code,
    valid: true,
    discountInr,
    discountAmount: discountInr,
    finalAmount: Math.max(0, amount - discountInr),
  });
});

/**
 * GET /coupons/offers — public active promo offers displayed on checkout page
 */
couponRouter.get('/offers', async (_req, res) => {
  const now = new Date();
  const rows = await prisma.coupon.findMany({
    where: {
      isActive: true,
      OR: [{ validTill: null }, { validTill: { gt: now } }],
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const valid = rows
    .filter((c) => (!c.validFrom || c.validFrom <= now) && (c.usageLimit == null || c.usedCount < c.usageLimit))
    .map((c) => ({
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      value: c.value,
      maxDiscount: c.maxDiscount,
      minAmount: c.minAmount,
      appliesTo: c.appliesTo,
      validTill: c.validTill,
    }));

  ok(res, valid, { total: valid.length });
});

/* ── Admin management ── */
const couponBaseSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,20}$/, 'Code must be 3-20 uppercase alphanumeric or hyphen/underscore characters'),
  description: z.string().max(200).optional(),
  discountType: z.enum(['percent', 'flat']),
  value: z.number().positive(),
  maxDiscount: z.number().int().positive().optional(),
  minAmount: z.number().int().min(0).default(0),
  appliesTo: z.array(z.enum(['stay', 'package', 'experience'])).default([]),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  validFrom: z.coerce.date().optional(),
  validTill: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
}).refine(
  (v) => v.discountType !== 'percent' || v.value <= 100,
  { message: 'Percent discount cannot exceed 100', path: ['value'] },
);

adminCouponRouter.use(requireStaff({ admin: 'canApproveAdCampaigns' }));

adminCouponRouter.get('/', async (req, res) => {
  const q = paginationSchema.parse(req.query);
  const [rows, total] = await Promise.all([
    prisma.coupon.findMany({ orderBy: { createdAt: 'desc' }, ...skipTake(q) }),
    prisma.coupon.count(),
  ]);
  ok(res, rows, pageMeta(q, total));
});

adminCouponRouter.post('/', async (req, res) => {
  const b = couponBaseSchema.parse(bodyOf(req));
  const staff = getStaff(req);
  const c = await prisma.coupon.create({ data: b });
  await audit({ actor: { id: staff.id, role: staff.role }, action: 'CREATE_COUPON', targetEntity: 'Coupon', targetId: c.id, req });
  created(res, c);
});

adminCouponRouter.put('/:id', async (req, res) => {
  const id = objectId.parse(req.params.id);
  const staff = getStaff(req);
  const patch = couponBaseSchema.partial().parse(bodyOf(req));
  const c = await prisma.coupon.update({ where: { id }, data: patch }).catch(() => null);
  if (!c) throw ApiError.notFound('Coupon');
  await audit({ actor: { id: staff.id, role: staff.role }, action: 'UPDATE_COUPON', targetEntity: 'Coupon', targetId: c.id, req });
  ok(res, c);
});

adminCouponRouter.delete('/:id', async (req, res) => {
  const id = objectId.parse(req.params.id);
  const staff = getStaff(req);
  const c = await prisma.coupon.update({ where: { id }, data: { isActive: false } }).catch(() => null);
  if (!c) throw ApiError.notFound('Coupon');
  await audit({ actor: { id: staff.id, role: staff.role }, action: 'DEACTIVATE_COUPON', targetEntity: 'Coupon', targetId: c.id, req });
  ok(res, { deactivated: true });
});
