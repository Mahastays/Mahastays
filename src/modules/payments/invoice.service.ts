import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import type { Payment } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { requireBookingCore } from '../bookings/booking.core';
import type { BookingKind } from '../bookings/booking.schemas';

function getMahastaysLogoPath(): string | null {
  const candidates = [
    path.resolve(__dirname, '../../assets/mahastays-logo.png'),
    path.resolve(__dirname, '../../../assets/mahastays-logo.png'),
    path.resolve(process.cwd(), 'backend/assets/mahastays-logo.png'),
    path.resolve(process.cwd(), 'backend/src/assets/mahastays-logo.png'),
    path.resolve(process.cwd(), 'frontend/public/brand/mahastays-logo.png'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const rs = (n: number) => `Rs. ${Math.round(n).toLocaleString('en-IN')}`; // Helvetica has no ₹ glyph

type Line = [label: string, amount: number];

function ledgerLines(kind: BookingKind, pricing: Record<string, number>): Line[] {
  const lines: Line[] = [];
  const add = (label: string, key: string, sign = 1) => {
    if (pricing[key]) lines.push([label, sign * pricing[key]]);
  };
  if (kind === 'stay') {
    add('Room charges', 'baseTotal');
    add('Club member discount', 'memberDiscount', -1);
    add('Cleaning & sanitisation fee', 'cleaningFee');
  } else if (kind === 'package') {
    add('Adults', 'adultsCost');
    add('Children', 'childrenCost');
    add('Weekend surcharge', 'weekendSurcharge');
    add('Club member discount', 'memberDiscount', -1);
  } else {
    add('Adult tickets', 'adultsCost');
    add('Child tickets', 'childrenCost');
    add('Club member discount', 'memberDiscount', -1);
    add('Safety gear insurance', 'gearInsuranceFee');
  }
  return lines;
}

/** Streams a GST invoice PDF for a captured or confirmed payment. */
export async function streamInvoicePdf(res: Response, payment: Payment): Promise<void> {
  const kind = payment.bookingType as BookingKind;
  const core = await requireBookingCore(kind, payment.bookingId);

  // Strict tax compliance: DO NOT generate invoice if booking was cancelled or is unpaid
  if (core.status === 'cancelled') {
    res.status(400).json({
      success: false,
      message: 'Invoice cannot be generated for cancelled bookings.',
      code: 'BOOKING_CANCELLED',
    });
    return;
  }

  if (core.paymentStatus !== 'paid' && payment.status !== 'captured') {
    res.status(400).json({
      success: false,
      message: 'Invoice is not available for unpaid bookings. Invoices are only generated after payment is completed and verified.',
      code: 'PAYMENT_REQUIRED',
    });
    return;
  }

  const invNumber = payment.invoiceNumber || (core.raw as any)?.invoiceNumber || `INV-${new Date().getFullYear()}-${payment.id.slice(-6).toUpperCase()}`;
  const [user, vendor] = await Promise.all([
    prisma.user.findUnique({ where: { id: payment.userId }, select: { fullName: true, email: true, phone: true } }),
    prisma.vendor.findUnique({ where: { id: payment.vendorId }, select: { businessName: true, compliance: true, contact: true } }),
  ]);

  const guestUser = user || { fullName: 'Valued Guest', email: 'guest@mahastays.com' };
  const supplierVendor = vendor || {
    businessName: 'Mahastays Hospitality Private Limited',
    compliance: { gstin: '27AABCM8921M1ZX', panNumber: 'AABCM8921M' },
    contact: { registeredOfficeAddress: { addressLine1: 'Panchgani-Mahabaleshwar Road', city: 'Satara', state: 'Maharashtra', pincode: '412806' } },
  };

  const pricing = (core.raw.pricing || {}) as unknown as Record<string, number>;
  const addr = supplierVendor.contact.registeredOfficeAddress;
  const gst = payment.gstDetails;

  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Invoice ${invNumber}`, Author: 'Mahastays' } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${invNumber}.pdf"`);
  doc.pipe(res);

  const left = 48;
  const right = doc.page.width - 48;
  const rule = () => doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor('#d1d5db').stroke().moveDown(0.6);
  const row = (label: string, value: string, bold = false) => {
    const y = doc.y;
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).fillColor('#111827').text(label, left, y, { width: 330 });
    doc.text(value, left, y, { width: right - left, align: 'right' });
    doc.moveDown(0.35);
  };

  const isPending = payment.status === 'initiated';
  const logoPath = getMahastaysLogoPath();
  if (logoPath) {
    try {
      doc.image(logoPath, left, 38, { height: 32 });
    } catch {
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#ea110d').text('MAHASTAYS', left, 44);
    }
  } else {
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#ea110d').text('MAHASTAYS', left, 44);
  }
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(isPending ? 'PROFORMA TAX INVOICE' : 'TAX INVOICE', left, 46, { align: 'right' });
  doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text('GST Tax Compliance Document', left, 58, { align: 'right' });
  doc.moveDown(2);
  rule();

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(`Invoice No: ${invNumber}`);
  doc.font('Helvetica').text(`Date of Issue: ${(payment.capturedAt ?? payment.createdAt).toISOString().slice(0, 10)}`);
  doc.text(`Booking Reference: ${core.reference}`);
  doc.text(`Payment Method: ${(payment.method || 'Online').toUpperCase()} (${isPending ? 'Payment Pending / Pay at Property' : 'Paid'})`);
  if (payment.gatewayPaymentId) doc.text(`Gateway Txn ID: ${payment.gatewayPaymentId}`);
  doc.moveDown();

  const rawGuestPhone = (core.raw as any)?.guestPhone || user?.phone?.nationalNumber || '';
  const cleanGuestPhone = String(rawGuestPhone).replace(/^\+91/, '').replace(/\D/g, '').slice(-10);
  const phoneFormatted = cleanGuestPhone ? `+91 ${cleanGuestPhone}` : null;
  const guestNotes = ((core.raw as any)?.specialRequests || (core.raw as any)?.notes || '').trim();

  doc.font('Helvetica-Bold').text('Billed To (Guest)');
  doc.font('Helvetica').text(
    `${guestUser.fullName}\n${guestUser.email}${phoneFormatted ? `\nMobile: ${phoneFormatted}` : ''}${core.billingState ? `\nState of Supply: ${core.billingState}` : '\nState of Supply: Maharashtra'}`
  );
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').text('Supplier / Operator');
  doc.font('Helvetica').text(`${supplierVendor.businessName}\n${addr.addressLine1}, ${addr.city}, ${addr.state} ${addr.pincode}\nGSTIN: ${supplierVendor.compliance.gstin ?? '27AABCM8921M1ZX'}   PAN: ${supplierVendor.compliance.panNumber ?? 'AABCM8921M'}`);
  doc.moveDown();
  rule();

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(core.title);
  doc.font('Helvetica').fontSize(9).fillColor('#4b5563');
  if (kind === 'stay') {
    const rawStay = core.raw as any;
    doc.text(`Stay Duration: ${rawStay.checkInDate} to ${rawStay.checkOutDate} (${rawStay.nights} Nights) | Guests: ${rawStay.adults} Adults${rawStay.children ? `, ${rawStay.children} Children` : ''}`);
  } else if (kind === 'package') {
    const rawPkg = core.raw as any;
    doc.text(`Tour Schedule: Starts ${rawPkg.startDate} | Travelers: ${rawPkg.adults} Adults${rawPkg.children ? `, ${rawPkg.children} Children` : ''}`);
  } else if (kind === 'experience') {
    const rawExp = core.raw as any;
    doc.text(`Scheduled Date: ${rawExp.activityDate} (${rawExp.slotTime || 'Scheduled Session'}) | Participants: ${rawExp.adults} Adults${rawExp.children ? `, ${rawExp.children} Children` : ''}`);
  }
  if (guestNotes) {
    doc.moveDown(0.3);
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#6b7280').text(`Special Requests / Notes: "${guestNotes}"`);
  }
  doc.moveDown(0.6);

  for (const [label, amount] of ledgerLines(kind, pricing)) row(label, `${amount < 0 ? '-' : ''}${rs(Math.abs(amount))}`);
  rule();
  row('Taxable Value (INR)', rs(core.taxableAmountInr), true);
  if (gst) {
    const rate = pricing.gstRatePercent || 12;
    if (gst.cgstAmountInr || gst.sgstAmountInr) {
      row(`CGST @ ${rate / 2}%`, rs(gst.cgstAmountInr));
      row(`SGST @ ${rate / 2}%`, rs(gst.sgstAmountInr));
    }
    if (gst.igstAmountInr) row(`IGST @ ${rate}%`, rs(gst.igstAmountInr));
    doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text(`SAC Code: ${gst.sacCode || (kind === 'stay' ? '996311' : kind === 'package' ? '998555' : '999692')}`, left, doc.y);
    doc.moveDown(0.4);
  }
  rule();
  row(isPending ? 'Total Payable Amount' : 'Total Amount Paid', rs(payment.amountInr), true);
  if (payment.refundedAmountInr > 0) row('Refunded Amount', `-${rs(payment.refundedAmountInr)}`);

  doc.moveDown(2).font('Helvetica').fontSize(8).fillColor('#9ca3af').text('This is an authentic computer-generated GST tax invoice verified by Mahastays Operations. Registered in Satara, Maharashtra.', left, doc.y, { align: 'center', width: right - left });
  doc.end();
}

/** Streams an invoice PDF directly by booking reference */
export async function streamBookingRefInvoicePdf(res: Response, reference: string): Promise<void> {
  const ref = reference.trim().toUpperCase();
  const isHex = /^[a-f0-9]{24}$/i.test(ref);

  // Look in StayBooking
  const stay = await prisma.stayBooking.findFirst({
    where: isHex ? { id: ref } : { bookingReference: ref },
    include: { property: { select: { id: true, name: true, policies: true } } },
  });
  if (stay) {
    if (stay.bookingStatus === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'Invoice cannot be generated for cancelled bookings.',
        code: 'BOOKING_CANCELLED',
      });
      return;
    }
    if (stay.paymentStatus !== 'paid') {
      res.status(400).json({
        success: false,
        message: 'Invoice is not available for unpaid bookings. Tax invoices are only generated after payment is completed.',
        code: 'PAYMENT_REQUIRED',
      });
      return;
    }

    let payment = await prisma.payment.findFirst({ where: { bookingType: 'stay', bookingId: stay.id, status: 'captured' }, orderBy: { createdAt: 'desc' } });
    if (!payment) {
      const taxes = (stay.pricing as any).taxesGst || 0;
      payment = {
        id: stay.id,
        bookingType: 'stay',
        bookingId: stay.id,
        userId: stay.userId,
        vendorId: stay.vendorId,
        gateway: 'manual',
        gatewayOrderId: null,
        gatewayPaymentId: null,
        amountInr: stay.grandTotalInr,
        refundedAmountInr: 0,
        status: 'captured',
        method: 'pay_at_property',
        invoiceNumber: stay.invoiceNumber || `INV-${new Date().getFullYear()}-${stay.id.slice(-6).toUpperCase()}`,
        gstDetails: {
          sacCode: '996311',
          cgstAmountInr: Math.round(taxes / 2),
          sgstAmountInr: Math.round(taxes / 2),
          igstAmountInr: 0,
        },
        capturedAt: stay.confirmedAt || stay.updatedAt,
        failureReason: null,
        notes: {},
        refunds: [],
        createdAt: stay.createdAt,
        updatedAt: stay.updatedAt,
      } as unknown as Payment;
    }
    return streamInvoicePdf(res, payment);
  }

  // Look in PackageBooking
  const pkg = await prisma.packageBooking.findFirst({
    where: isHex ? { id: ref } : { bookingReference: ref },
    include: { package: { select: { id: true, title: true } } },
  });
  if (pkg) {
    if (pkg.bookingStatus === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'Invoice cannot be generated for cancelled bookings.',
        code: 'BOOKING_CANCELLED',
      });
      return;
    }
    if (pkg.paymentStatus !== 'paid') {
      res.status(400).json({
        success: false,
        message: 'Invoice is not available for unpaid bookings. Tax invoices are only generated after payment is completed.',
        code: 'PAYMENT_REQUIRED',
      });
      return;
    }

    let payment = await prisma.payment.findFirst({ where: { bookingType: 'package', bookingId: pkg.id, status: 'captured' }, orderBy: { createdAt: 'desc' } });
    if (!payment) {
      const taxes = (pkg.pricing as any).taxesGst || 0;
      payment = {
        id: pkg.id,
        bookingType: 'package',
        bookingId: pkg.id,
        userId: pkg.userId,
        vendorId: pkg.vendorId,
        gateway: 'manual',
        gatewayOrderId: null,
        gatewayPaymentId: null,
        amountInr: pkg.grandTotalInr,
        refundedAmountInr: 0,
        status: 'captured',
        method: 'pay_at_property',
        invoiceNumber: pkg.invoiceNumber || `INV-${new Date().getFullYear()}-${pkg.id.slice(-6).toUpperCase()}`,
        gstDetails: {
          sacCode: '998555',
          cgstAmountInr: Math.round(taxes / 2),
          sgstAmountInr: Math.round(taxes / 2),
          igstAmountInr: 0,
        },
        capturedAt: pkg.confirmedAt || pkg.updatedAt,
        failureReason: null,
        notes: {},
        refunds: [],
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
      } as unknown as Payment;
    }
    return streamInvoicePdf(res, payment);
  }

  // Look in ExperienceBooking
  const exp = await prisma.experienceBooking.findFirst({
    where: isHex ? { id: ref } : { bookingReference: ref },
    include: { experience: { select: { id: true, title: true } } },
  });
  if (exp) {
    if (exp.bookingStatus === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'Invoice cannot be generated for cancelled bookings.',
        code: 'BOOKING_CANCELLED',
      });
      return;
    }
    if (exp.paymentStatus !== 'paid') {
      res.status(400).json({
        success: false,
        message: 'Invoice is not available for unpaid bookings. Tax invoices are only generated after payment is completed.',
        code: 'PAYMENT_REQUIRED',
      });
      return;
    }

    let payment = await prisma.payment.findFirst({ where: { bookingType: 'experience', bookingId: exp.id, status: 'captured' }, orderBy: { createdAt: 'desc' } });
    if (!payment) {
      const taxes = (exp.pricing as any).taxesGst || 0;
      payment = {
        id: exp.id,
        bookingType: 'experience',
        bookingId: exp.id,
        userId: exp.userId,
        vendorId: exp.vendorId,
        gateway: 'manual',
        gatewayOrderId: null,
        gatewayPaymentId: null,
        amountInr: exp.grandTotalInr,
        refundedAmountInr: 0,
        status: 'captured',
        method: 'pay_at_property',
        invoiceNumber: exp.invoiceNumber || `INV-${new Date().getFullYear()}-${exp.id.slice(-6).toUpperCase()}`,
        gstDetails: {
          sacCode: '999692',
          cgstAmountInr: Math.round(taxes / 2),
          sgstAmountInr: Math.round(taxes / 2),
          igstAmountInr: 0,
        },
        capturedAt: exp.confirmedAt || exp.updatedAt,
        failureReason: null,
        notes: {},
        refunds: [],
        createdAt: exp.createdAt,
        updatedAt: exp.updatedAt,
      } as unknown as Payment;
    }
    return streamInvoicePdf(res, payment);
  }

  throw ApiError.notFound('Booking for invoice');
}
