import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import type { Payment } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { requireBookingCore } from '../bookings/booking.core';
import type { BookingKind } from '../bookings/booking.schemas';

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

/** Streams a GST invoice PDF for a captured payment. */
export async function streamInvoicePdf(res: Response, payment: Payment): Promise<void> {
  if (!payment.invoiceNumber || payment.status === 'initiated') throw ApiError.conflict('Invoice is not available until the payment is captured', 'INVOICE_NOT_READY');
  const kind = payment.bookingType as BookingKind;
  const core = await requireBookingCore(kind, payment.bookingId);
  const [user, vendor] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: payment.userId }, select: { fullName: true, email: true } }),
    prisma.vendor.findUniqueOrThrow({ where: { id: payment.vendorId }, select: { businessName: true, compliance: true, contact: true } }),
  ]);
  const pricing = core.raw.pricing as unknown as Record<string, number>;
  const addr = vendor.contact.registeredOfficeAddress;
  const gst = payment.gstDetails;

  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Invoice ${payment.invoiceNumber}`, Author: 'Mahastays' } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${payment.invoiceNumber}.pdf"`);
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

  doc.font('Helvetica-Bold').fontSize(20).fillColor('#173e45').text('Mahastays', left, 48);
  doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text('TAX INVOICE', left, 52, { align: 'right' });
  doc.moveDown(1.2);
  rule();

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(`Invoice No: ${payment.invoiceNumber}`);
  doc.font('Helvetica').text(`Date: ${(payment.capturedAt ?? payment.createdAt).toISOString().slice(0, 10)}`);
  doc.text(`Booking reference: ${core.reference}`);
  doc.text(`Payment ID: ${payment.gatewayPaymentId ?? '—'}${payment.method ? ` (${payment.method})` : ''}`);
  doc.moveDown();

  doc.font('Helvetica-Bold').text('Billed to');
  doc.font('Helvetica').text(`${user.fullName}\n${user.email}${core.billingState ? `\nState: ${core.billingState}` : ''}`);
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').text('Supplier');
  doc.font('Helvetica').text(`${vendor.businessName}\n${addr.addressLine1}, ${addr.city}, ${addr.state} ${addr.pincode}\nGSTIN: ${vendor.compliance.gstin ?? 'Not registered'}   PAN: ${vendor.compliance.panNumber}`);
  doc.moveDown();
  rule();

  doc.font('Helvetica-Bold').text(core.title);
  doc.moveDown(0.5);
  for (const [label, amount] of ledgerLines(kind, pricing)) row(label, `${amount < 0 ? '-' : ''}${rs(Math.abs(amount))}`);
  rule();
  row('Taxable value', rs(core.taxableAmountInr), true);
  if (gst) {
    const rate = pricing.gstRatePercent;
    if (gst.cgstAmountInr || gst.sgstAmountInr) {
      row(`CGST @ ${rate / 2}%`, rs(gst.cgstAmountInr));
      row(`SGST @ ${rate / 2}%`, rs(gst.sgstAmountInr));
    }
    if (gst.igstAmountInr) row(`IGST @ ${rate}%`, rs(gst.igstAmountInr));
    doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text(`SAC: ${gst.sacCode}`, left, doc.y);
    doc.moveDown(0.4);
  }
  rule();
  row('Total paid', rs(payment.amountInr), true);
  if (payment.refundedAmountInr > 0) row('Refunded', `-${rs(payment.refundedAmountInr)}`);

  doc.moveDown(2).font('Helvetica').fontSize(8).fillColor('#9ca3af').text('This is a computer-generated invoice and does not require a signature.', left, doc.y, { align: 'center', width: right - left });
  doc.end();
}
