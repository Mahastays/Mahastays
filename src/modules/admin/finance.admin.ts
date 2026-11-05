import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { getStaff, requireStaff } from '../../middlewares/staff';
import { audit } from '../../services/audit.service';
import { ok, paginated } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { pageMeta, paginationSchema, skipTake } from '../../utils/pagination';
import { bodyOf, objectId } from '../../utils/zod';
import { auditPayoutSchema, failPayoutSchema, payoutListQuery } from '../payouts/payout.schemas';
import { z } from 'zod';
import { adminCompletePayout, auditPayout, failPayout, getPayout, listPayouts } from '../payouts/payout.service';
import { generatePayoutReference } from '../../utils/codes';
import { sendEmail } from '../../services/notification.service';
import { presentPayout } from '../payouts/payout.presenter';

export const adminFinanceRouter = Router();

const finance = requireStaff({ admin: true, sub_admin: true });

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

const completePayoutInputSchema = z.object({
  utrNumber: z.string().trim().min(2, 'Transaction / UTR number is required'),
  transferMethod: z.enum(['NEFT', 'RTGS', 'IMPS', 'neft', 'rtgs', 'imps']).optional(),
  notes: z.string().trim().optional(),
});

adminFinanceRouter.post('/settlements/:id/complete', finance, async (req, res) => {
  const body = completePayoutInputSchema.parse(bodyOf(req));
  const staff = getStaff(req);
  const payout = await adminCompletePayout(
    objectId.parse(req.params.id),
    staff,
    {
      utrNumber: body.utrNumber,
      transferMethod: (body.transferMethod?.toUpperCase() as any) || 'NEFT',
      notes: body.notes,
    },
    req
  );
  ok(res, payout);
});

adminFinanceRouter.post('/settlements/:id/process', finance, async (req, res) => {
  const body = completePayoutInputSchema.parse(bodyOf(req));
  const staff = getStaff(req);
  const payout = await adminCompletePayout(
    objectId.parse(req.params.id),
    staff,
    {
      utrNumber: body.utrNumber,
      transferMethod: (body.transferMethod?.toUpperCase() as any) || 'NEFT',
      notes: body.notes,
    },
    req
  );
  ok(res, payout);
});

const directSettlementInputSchema = z.object({
  vendorId: objectId,
  amountInr: z.number().int().positive('Amount must be greater than zero'),
  transferMethod: z.enum(['NEFT', 'RTGS', 'IMPS', 'UPI', 'neft', 'rtgs', 'imps', 'upi']).optional(),
  utrNumber: z.string().trim().min(2, 'Transaction / UTR number is required'),
  notes: z.string().trim().optional(),
});

adminFinanceRouter.post('/direct-settlement', finance, async (req, res) => {
  const body = directSettlementInputSchema.parse(bodyOf(req));
  const staff = getStaff(req);

  const vendor = await prisma.vendor.findUnique({
    where: { id: body.vendorId },
  });
  if (!vendor) throw ApiError.notFound('Vendor');

  const bankSnapshot = vendor.banking
    ? {
        accountHolderName: vendor.banking.accountHolderName,
        accountNumberEnc: vendor.banking.accountNumberEnc,
        accountNumberLast4: vendor.banking.accountNumberLast4,
        bankName: vendor.banking.bankName,
        ifscCode: vendor.banking.ifscCode,
        branchName: vendor.banking.branchName || null,
        upiId: vendor.banking.upiId || null,
      }
    : {
        accountHolderName: vendor.displayName || vendor.businessName,
        accountNumberEnc: '',
        accountNumberLast4: '0000',
        bankName: 'Direct Bank Settlement',
        ifscCode: 'MANUAL',
        branchName: null,
        upiId: null,
      };

  const now = new Date();
  const payoutRef = await generatePayoutReference();
  const method = (body.transferMethod?.toUpperCase() as any) || 'NEFT';

  const [payout] = await prisma.$transaction([
    prisma.vendorPayout.create({
      data: {
        payoutReference: payoutRef,
        vendorId: vendor.id,
        periodFrom: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        periodTo: now,
        lines: [],
        grossBookingsAmountInr: body.amountInr,
        vendorShareTotalInr: body.amountInr,
        platformCommissionDeductedInr: 0,
        tdsRatePercent: 0,
        tdsDeductedInr: 0,
        netPayableAmountInr: body.amountInr,
        bank: bankSnapshot,
        transferMethod: method,
        utrNumber: body.utrNumber,
        status: 'completed',
        notes: body.notes || 'Direct bank settlement disbursed by Admin',
        approvedBySuperAdminId: staff.id,
        releasedAt: now,
        completedAt: now,
      },
    }),
    prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        walletLifetimeEarningsInr: { increment: body.amountInr },
        walletAvailableInr: { decrement: Math.min(vendor.walletAvailableInr, body.amountInr) },
        ...(vendor.banking && !vendor.banking.isAccountVerified
          ? { banking: { set: { ...vendor.banking, isAccountVerified: true } } }
          : {}),
      },
    }),
  ]);

  await audit({
    actor: { id: staff.id, role: staff.role },
    action: 'DIRECT_SETTLEMENT_PAYOUT',
    targetEntity: 'VendorPayout',
    targetId: payout.id,
    newState: {
      vendorId: vendor.id,
      amountInr: body.amountInr,
      utrNumber: body.utrNumber,
      transferMethod: method,
    },
    req,
  });

  void sendEmail({
    to: vendor.email,
    subject: `Bank Settlement ${payoutRef} Disbursed (UTR: ${body.utrNumber})`,
    html: `<p>Dear ${vendor.displayName || vendor.businessName},</p><p>A bank settlement transfer of <b>₹${body.amountInr.toLocaleString('en-IN')}</b> has been successfully processed and transferred to your bank account via ${method}.</p><p><b>Bank Transaction / UTR Number:</b> ${body.utrNumber}</p><p>Thank you for partnering with Mahastays.</p>`,
  }).catch(() => {});

  ok(res, presentPayout(payout));
});

/**
 * GET /admin/finance/vendor-settlement-ledger
 * Returns each vendor's earnings, gross revenue, platform commission, amount settled by admin,
 * pending amount to be settled, bank snapshot, and all payout requests submitted by vendors.
 */
adminFinanceRouter.get('/vendor-settlement-ledger', finance, async (_req, res) => {
  const [vendors, stays, packages, experiences, allPayouts] = await Promise.all([
    prisma.vendor.findMany({
      select: {
        id: true,
        vendorCode: true,
        businessName: true,
        displayName: true,
        category: true,
        email: true,
        phone: true,
        commissionTerms: true,
        banking: true,
        walletPendingInr: true,
        walletAvailableInr: true,
        walletLifetimeEarningsInr: true,
        walletLifetimeCommissionInr: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.stayBooking.findMany({
      where: { paymentStatus: { in: ['paid', 'partially_refunded'] } },
      select: {
        id: true,
        vendorId: true,
        grandTotalInr: true,
        commissionAmountInr: true,
        vendorShareInr: true,
        commissionRatePercent: true,
        paymentStatus: true,
        bookingStatus: true,
      },
    }),
    prisma.packageBooking.findMany({
      where: { paymentStatus: { in: ['paid', 'partially_refunded'] } },
      select: {
        id: true,
        vendorId: true,
        grandTotalInr: true,
        commissionAmountInr: true,
        vendorShareInr: true,
        commissionRatePercent: true,
        paymentStatus: true,
        bookingStatus: true,
      },
    }),
    prisma.experienceBooking.findMany({
      where: { paymentStatus: { in: ['paid', 'partially_refunded'] } },
      select: {
        id: true,
        vendorId: true,
        grandTotalInr: true,
        commissionAmountInr: true,
        vendorShareInr: true,
        commissionRatePercent: true,
        paymentStatus: true,
        bookingStatus: true,
      },
    }),
    prisma.vendorPayout.findMany({
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const vendorMap = new Map<string, (typeof vendors)[0]>();
  vendors.forEach((v) => vendorMap.set(v.id, v));

  let totalGrossVolumeInr = 0;
  let totalPlatformCommissionInr = 0;
  let totalNetVendorShareInr = 0;
  let totalSettledAmountInr = 0;
  let totalPendingSettlementInr = 0;
  let pendingRequestsCount = 0;
  let pendingRequestsAmountInr = 0;

  const vendorRows = vendors.map((v) => {
    const vStays = stays.filter((s) => s.vendorId === v.id);
    const vPackages = packages.filter((p) => p.vendorId === v.id);
    const vExps = experiences.filter((e) => e.vendorId === v.id);

    const totalBookingsCount = vStays.length + vPackages.length + vExps.length;

    const grossRevenueInr =
      vStays.reduce((s, b) => s + (b.grandTotalInr || 0), 0) +
      vPackages.reduce((s, b) => s + (b.grandTotalInr || 0), 0) +
      vExps.reduce((s, b) => s + (b.grandTotalInr || 0), 0);

    const platformCommissionInr =
      vStays.reduce((s, b) => s + (b.commissionAmountInr || 0), 0) +
      vPackages.reduce((s, b) => s + (b.commissionAmountInr || 0), 0) +
      vExps.reduce((s, b) => s + (b.commissionAmountInr || 0), 0);

    const netRevenueInr = grossRevenueInr - platformCommissionInr;

    // Completed payouts for this vendor (disbursed to their bank with UTR)
    const vPayouts = allPayouts.filter((p) => p.vendorId === v.id);
    const completedPayouts = vPayouts.filter((p) => p.status === 'completed');
    const amountSettledInr = completedPayouts.reduce((s, p) => s + (p.netPayableAmountInr || 0), 0);

    // Pending payout requests awaiting transfer
    const pendingPayouts = vPayouts.filter(
      (p) => p.status === 'requested' || p.status === 'audited_by_admin' || p.status === 'released_by_superadmin'
    );
    const pendingPayoutRequestsCount = pendingPayouts.length;
    const pendingPayoutRequestsAmountInr = pendingPayouts.reduce((s, p) => s + (p.netPayableAmountInr || 0), 0);

    // Remaining net balance pending to be settled
    const pendingSettlementInr = Math.max(0, netRevenueInr - amountSettledInr);

    totalGrossVolumeInr += grossRevenueInr;
    totalPlatformCommissionInr += platformCommissionInr;
    totalNetVendorShareInr += netRevenueInr;
    totalSettledAmountInr += amountSettledInr;
    totalPendingSettlementInr += pendingSettlementInr;
    pendingRequestsCount += pendingPayoutRequestsCount;
    pendingRequestsAmountInr += pendingPayoutRequestsAmountInr;

    return {
      vendorId: v.id,
      vendorCode: v.vendorCode,
      businessName: v.businessName,
      displayName: v.displayName,
      category: v.category,
      email: v.email,
      phone: v.phone,
      commissionRatePercent: v.commissionTerms?.propertyCommissionRatePercent || 12,
      banking: v.banking
        ? {
            accountHolderName: v.banking.accountHolderName,
            bankName: v.banking.bankName,
            accountNumberMasked: v.banking.accountNumberLast4
              ? `•••• •••• •••• ${v.banking.accountNumberLast4}`
              : 'Not provided',
            ifscCode: v.banking.ifscCode,
            branchName: v.banking.branchName || null,
            upiId: v.banking.upiId || null,
            isAccountVerified: !!v.banking.isAccountVerified,
          }
        : null,
      totalBookingsCount,
      grossRevenueInr,
      platformCommissionInr,
      netRevenueInr,
      amountSettledInr,
      pendingSettlementInr,
      walletAvailableInr: v.walletAvailableInr,
      walletPendingInr: v.walletPendingInr,
      pendingPayoutRequestsCount,
      pendingPayoutRequestsAmountInr,
      recentPayouts: vPayouts.slice(0, 5).map((p) => ({
        id: p.id,
        payoutReference: p.payoutReference,
        netPayableAmountInr: p.netPayableAmountInr,
        status: p.status,
        transferMethod: p.transferMethod,
        utrNumber: p.utrNumber,
        createdAt: p.createdAt.toISOString(),
        completedAt: p.completedAt?.toISOString() || null,
      })),
    };
  });

  // Payout requests with vendor names attached
  const payoutRequests = allPayouts.map((p) => {
    const v = vendorMap.get(p.vendorId);
    return {
      ...presentPayout(p),
      vendorName: v?.displayName || v?.businessName || 'Vendor Partner',
      vendorEmail: v?.email || '',
      vendorPhone: v?.phone || '',
      vendorCode: v?.vendorCode || '',
    };
  });

  ok(res, {
    summary: {
      totalVendorsCount: vendors.length,
      totalGrossVolumeInr,
      totalPlatformCommissionInr,
      totalNetVendorShareInr,
      totalSettledAmountInr,
      totalPendingSettlementInr,
      pendingRequestsCount,
      pendingRequestsAmountInr,
    },
    vendors: vendorRows,
    payoutRequests,
  });
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
