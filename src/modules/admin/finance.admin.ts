import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { getStaff, requireStaff } from '../../middlewares/staff';
import { audit } from '../../services/audit.service';
import { ok, paginated } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { pageMeta, paginationSchema, skipTake } from '../../utils/pagination';
import { bodyOf, objectId } from '../../utils/zod';
import { auditPayoutSchema, failPayoutSchema, payoutListQuery } from '../payouts/payout.schemas';
import { auditPayout, failPayout, getPayout, listPayouts } from '../payouts/payout.service';

export const adminFinanceRouter = Router();

/** Admins audit; only the Super-Admin can release money (see superadmin routes). */
const finance = requireStaff({ admin: 'canExportFinancialReports' });

const parseRange = (q: Record<string, unknown>) => {
  const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const defaultTo = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const from = typeof q.from === 'string' && !isNaN(Date.parse(q.from)) ? new Date(q.from) : defaultFrom;
  const to = typeof q.to === 'string' && !isNaN(Date.parse(q.to)) ? new Date(new Date(q.to).getTime() + 24 * 60 * 60 * 1000) : defaultTo;
  if (to <= from) throw ApiError.badRequest('`to` must be after `from`');
  return { from, to };
};

const csvCell = (v: unknown) => {
  const s = v == null ? '' : v instanceof Date ? v.toISOString() : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : /^[=+\-@]/.test(s) ? `'${s}` : s;
};

adminFinanceRouter.get('/settlements', finance, async (req, res) => {
  const { items, meta } = await listPayouts(payoutListQuery.parse(req.query));
  ok(res, items, meta);
});

adminFinanceRouter.get('/settlements/:id', finance, async (req, res) => {
  ok(res, await getPayout(objectId.parse(req.params.id)));
});

adminFinanceRouter.post('/settlements/:id/audit', finance, async (req, res) => {
  ok(res, await auditPayout(objectId.parse(req.params.id), getStaff(req), auditPayoutSchema.parse(bodyOf(req)).notes, req));
});

adminFinanceRouter.post('/settlements/:id/reject', finance, async (req, res) => {
  ok(res, await failPayout(objectId.parse(req.params.id), getStaff(req), failPayoutSchema.parse(bodyOf(req)).reason, req));
});

/** GET /admin/finance/summary?from=YYYY-MM-DD&to=YYYY-MM-DD */
adminFinanceRouter.get('/summary', finance, async (req, res) => {
  const { from, to } = parseRange(req.query as Record<string, unknown>);
  const window = { gte: from, lt: to };

  const [stays, packages, experiences, pays, refunds, payoutAgg] = await Promise.all([
    prisma.stayBooking.aggregate({
      _sum: { grandTotalInr: true, vendorShareInr: true, commissionAmountInr: true },
      _count: { _all: true },
      where: { paymentStatus: { in: ['paid', 'partially_refunded', 'refunded'] }, createdAt: window },
    }),
    prisma.packageBooking.aggregate({
      _sum: { grandTotalInr: true, vendorShareInr: true, commissionAmountInr: true },
      _count: { _all: true },
      where: { paymentStatus: { in: ['paid', 'partially_refunded', 'refunded'] }, createdAt: window },
    }),
    prisma.experienceBooking.aggregate({
      _sum: { grandTotalInr: true, vendorShareInr: true, commissionAmountInr: true },
      _count: { _all: true },
      where: { paymentStatus: { in: ['paid', 'partially_refunded', 'refunded'] }, createdAt: window },
    }),
    prisma.payment.findMany({
      where: { status: { in: ['captured', 'refunded'] }, capturedAt: window },
      select: { gstDetails: true, amountInr: true, bookingType: true },
    }),
    prisma.refund.aggregate({
      _sum: { amountInr: true },
      _count: { _all: true },
      where: { createdAt: window, status: 'processed' },
    }),
    prisma.vendorPayout.groupBy({
      by: ['status'],
      _sum: { netPayableAmountInr: true },
      _count: { _all: true },
      where: { createdAt: window },
    }),
  ]);

  const gst = pays.reduce(
    (s, p) => {
      const g = (p.gstDetails ?? {}) as { cgstAmountInr?: number; sgstAmountInr?: number; igstAmountInr?: number };
      return {
        cgst: s.cgst + (g.cgstAmountInr ?? 0),
        sgst: s.sgst + (g.sgstAmountInr ?? 0),
        igst: s.igst + (g.igstAmountInr ?? 0),
      };
    },
    { cgst: 0, sgst: 0, igst: 0 }
  );

  const byType = [
    { t: 'stay', a: stays },
    { t: 'package', a: packages },
    { t: 'experience', a: experiences },
  ];

  const bookingsTotal = stays._count._all + packages._count._all + experiences._count._all;
  const gmvInr = (stays._sum.grandTotalInr ?? 0) + (packages._sum.grandTotalInr ?? 0) + (experiences._sum.grandTotalInr ?? 0);
  const platformCommissionInr = (stays._sum.commissionAmountInr ?? 0) + (packages._sum.commissionAmountInr ?? 0) + (experiences._sum.commissionAmountInr ?? 0);
  const vendorGrossInr = (stays._sum.vendorShareInr ?? 0) + (packages._sum.vendorShareInr ?? 0) + (experiences._sum.vendorShareInr ?? 0);

  ok(res, {
    period: { from: from.toISOString().slice(0, 10), to: new Date(to.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10) },
    bookings: bookingsTotal,
    gmvInr,
    platformCommissionInr,
    vendorGrossInr,
    gstCollectedInr: { ...gst, total: gst.cgst + gst.sgst + gst.igst },
    refunds: { count: refunds._count._all, amountInr: refunds._sum.amountInr ?? 0 },
    byType: Object.fromEntries(
      byType.map((x) => [x.t, { bookings: x.a._count._all, gmvInr: x.a._sum.grandTotalInr ?? 0, commissionInr: x.a._sum.commissionAmountInr ?? 0 }])
    ),
    payouts: Object.fromEntries(payoutAgg.map((p) => [p.status, { count: p._count._all, netInr: p._sum.netPayableAmountInr ?? 0 }])),
  });
});

/** GET /admin/finance/payments */
adminFinanceRouter.get('/payments', finance, async (req, res) => {
  const p = paginationSchema.parse(req.query);
  const { from, to } = parseRange(req.query as Record<string, unknown>);
  const where: any = {
    createdAt: { gte: from, lt: to },
    ...(typeof req.query.status === 'string' ? { status: req.query.status } : {}),
    ...(typeof req.query.bookingType === 'string' ? { bookingType: req.query.bookingType } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(p) }),
    prisma.payment.count({ where }),
  ]);
  paginated(
    res,
    rows.map(({ gatewaySignature: _s, ...item }) => item),
    pageMeta(p, total)
  );
});

/** GET /admin/finance/export/payments.csv — GST-ready ledger of captured payments */
adminFinanceRouter.get('/export/payments.csv', finance, async (req, res) => {
  const { from, to } = parseRange(req.query as Record<string, unknown>);
  const rows = await prisma.payment.findMany({
    where: { status: { in: ['captured', 'refunded'] }, capturedAt: { gte: from, lt: to } },
    orderBy: { capturedAt: 'asc' },
    take: 50_000,
  });

  const head = [
    'invoice_number',
    'captured_at',
    'booking_type',
    'booking_id',
    'amount_inr',
    'refunded_inr',
    'method',
    'gateway_payment_id',
    'sac_code',
    'gst_percent',
    'taxable_value',
    'cgst',
    'sgst',
    'igst',
    'place_of_supply',
    'vendor_gstin',
  ];

  const lines = rows.map((p) => {
    const g = (p.gstDetails ?? {}) as any;
    return [
      p.invoiceNumber,
      p.capturedAt,
      p.bookingType,
      p.bookingId,
      p.amountInr,
      p.refundedAmountInr,
      p.method,
      p.gatewayPaymentId,
      g.sacCode,
      g.gstPercent ?? 18,
      g.taxableAmountInr ?? p.amountInr,
      g.cgstAmountInr,
      g.sgstAmountInr,
      g.igstAmountInr,
      g.placeOfSupply ?? 'MH',
      g.gstinVendor,
    ]
      .map(csvCell)
      .join(',');
  });

  const staff = getStaff(req);
  await audit({
    actor: { id: staff.id, role: staff.role },
    action: 'EXPORT_FINANCIAL_REPORT',
    targetEntity: 'Payment',
    newState: { from, to, rows: rows.length },
    req,
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="payments_${from.toISOString().slice(0, 10)}_${new Date(to.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}.csv"`
  );
  res.send([head.join(','), ...lines].join('\n'));
});
