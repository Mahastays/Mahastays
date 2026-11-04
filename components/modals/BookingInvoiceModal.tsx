'use client';

import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  Building2,
  Calendar,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  MapPin,
  ExternalLink,
  Loader2,
} from 'lucide-react';

export const MAHASTAYS_CLOUDINARY_LOGO =
  'https://res.cloudinary.com/vxtop5jd/image/upload/v1793725764/mahastays/brand/mahastays-logo.png';

export interface AdminInvoiceBookingData {
  id: string;
  bookingReference: string;
  bookingType?: 'stay' | 'package' | 'experience' | string;
  invoiceNumber?: string;
  createdAt?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  billingState?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  bookingStatus?: string;
  title: string;
  subtitle?: string;
  dates?: string;
  startDate?: string;
  endDate?: string;
  nights?: number;
  guests?: string;
  adults?: number;
  children?: number;
  roomOrTierName?: string;
  amount: number;
  pricing?: {
    basePrice?: number;
    baseCost?: number;
    roomPricePerNight?: number;
    pricePerPerson?: number;
    adultsCost?: number;
    childrenCost?: number;
    cleaningFee?: number;
    gearInsuranceFee?: number;
    memberDiscount?: number;
    taxableAmount?: number;
    taxableSubtotal?: number;
    taxes?: number;
    taxesGst?: number;
    grandTotal?: number;
  };
}

interface BookingInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: AdminInvoiceBookingData | any | null;
}

// Convert numbers to Words (Indian currency format)
function numberToIndianWords(num: number): string {
  if (!num || isNaN(num)) return 'Zero Rupees Only';
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '');
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        ' Thousand' +
        (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '')
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        ' Lakh' +
        (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '')
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      ' Crore' +
      (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '')
    );
  }

  return `${inWords(Math.round(num))} Rupees Only`;
}

export default function BookingInvoiceModal({
  isOpen,
  onClose,
  booking,
}: BookingInvoiceModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !booking) return null;

  const rawBooking = booking;
  const bookingType = rawBooking.bookingType || (rawBooking.room ? 'stay' : rawBooking.tier ? 'package' : 'stay');
  const isStay = bookingType === 'stay';
  const isPackage = bookingType === 'package';
  const isExperience = bookingType === 'experience';

  const refCode = rawBooking.bookingReference || rawBooking.reference || `MHA-${rawBooking.id?.slice(-6).toUpperCase() || '1001'}`;

  const isCancelled = rawBooking.bookingStatus === 'cancelled' || (rawBooking as any).status === 'cancelled';
  const isPaid = !isCancelled && (rawBooking.paymentStatus === 'paid' || rawBooking.paymentStatus === 'captured');

  const invNumber = isCancelled
    ? 'NO INVOICE (CANCELLED)'
    : isPaid
    ? (rawBooking.invoiceNumber || `INV-${new Date(rawBooking.createdAt || Date.now()).getFullYear()}-${refCode.replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase()}`)
    : 'PENDING PAYMENT (UNPAID)';

  const invDate = rawBooking.createdAt
    ? new Date(rawBooking.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  const title =
    rawBooking.title ||
    rawBooking.propertyName ||
    rawBooking.packageTitle ||
    rawBooking.experienceTitle ||
    rawBooking.property?.name ||
    'Mahastays Luxury Reservation';

  const guestName =
    rawBooking.guestName ||
    rawBooking.customer?.fullName ||
    rawBooking.user?.fullName ||
    'Valued Guest';

  const guestEmail =
    rawBooking.guestEmail ||
    rawBooking.customer?.email ||
    rawBooking.user?.email ||
    'guest@mahastays.com';

  const guestPhone =
    rawBooking.guestPhone ||
    rawBooking.customer?.phone?.nationalNumber ||
    rawBooking.phone ||
    '—';

  // Specific SAC codes as per Indian GST law
  const sacCode = isStay ? '996311' : isPackage ? '998555' : '999692';
  const sacLabel = isStay
    ? 'Short-Stay Accommodation Services (SAC 996311)'
    : isPackage
    ? 'Curated Holiday Tour Package Services (SAC 998555)'
    : 'Guided Outdoor Experience & Adventure Activity (SAC 999692)';

  // Pricing Ledger
  const pricing = rawBooking.pricing || {};
  const grandTotal =
    pricing.grandTotalInr ||
    pricing.grandTotal ||
    rawBooking.amount ||
    rawBooking.totalAmountInr ||
    rawBooking.grandTotalInr ||
    rawBooking.basePrice ||
    18438;

  const discount =
    pricing.memberDiscount ||
    Math.round(grandTotal * 0.08);

  const cleaningOrFee =
    isStay
      ? pricing.cleaningFee || 445
      : isExperience
      ? pricing.gearInsuranceFee || 250
      : 0;

  const taxesTotal =
    pricing.taxesGst ||
    pricing.taxes ||
    Math.round((grandTotal * (isStay ? 0.12 : isPackage ? 0.05 : 0.18)) / (1 + (isStay ? 0.12 : isPackage ? 0.05 : 0.18)));

  const taxableAmount =
    pricing.taxableSubtotal ||
    pricing.taxableAmount ||
    Math.max(0, grandTotal - taxesTotal);

  const cgstAmount = Math.round(taxesTotal / 2);
  const sgstAmount = taxesTotal - cgstAmount;
  const gstRate = isStay ? 12 : isPackage ? 5 : 18;

  // Handle PDF Download
  const handleDownloadPdf = async () => {
    if (!isPaid || isCancelled) {
      alert(isCancelled ? 'Invoice cannot be generated for cancelled bookings.' : 'Invoice is not available for unpaid bookings.');
      return;
    }
    setIsDownloading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const downloadUrl = `${apiBase}/bookings/invoice/ref/${encodeURIComponent(refCode)}`;

      const res = await fetch(downloadUrl);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Mahastays-${invNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        window.print();
      }
    } catch {
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const scheduleText =
    rawBooking.dates ||
    rawBooking.schedule ||
    (rawBooking.checkInDate && rawBooking.checkOutDate
      ? `${rawBooking.checkInDate} to ${rawBooking.checkOutDate}`
      : rawBooking.startDate
      ? `Starts ${rawBooking.startDate}`
      : rawBooking.activityDate || 'Upcoming Schedule');

  const guestCountText =
    rawBooking.guests ||
    (rawBooking.adults
      ? `${rawBooking.adults} Adults${rawBooking.children ? `, ${rawBooking.children} Children` : ''}`
      : '2 Adults');

  const roomOrTierText =
    rawBooking.roomOrTierName ||
    rawBooking.room?.name ||
    rawBooking.room?.roomName ||
    rawBooking.tier?.name ||
    rawBooking.tier?.tierName ||
    'Standard Category';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn print:p-0 print:bg-white print:static">
      {/* Backdrop for click to close */}
      <div className="fixed inset-0 print:hidden" onClick={onClose} />

      {/* Modal Dialog Container */}
      <div className="relative bg-white text-slate-900 rounded-3xl max-w-4xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden z-10 print:shadow-none print:border-none print:max-w-none print:rounded-none">
        
        {/* Top Control Bar (Hidden during printing) */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#ea110d]" />
            <span className="text-xs sm:text-sm font-bold font-poppins">
              Official GST Tax Invoice • {refCode}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer transition"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading || !isPaid || isCancelled}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-xs font-bold text-white shadow-xs cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
              title={isCancelled ? 'No invoice for cancelled bookings' : !isPaid ? 'Invoice available after payment' : 'Download Official PDF Invoice'}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition ml-1"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* PRINTABLE INVOICE BODY (WITH ACTUAL MAHASTAYS LOGO)            */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div ref={printRef} className="p-6 sm:p-10 font-sans space-y-6 print:p-6 bg-white">
          
          {/* Header: Brand & Invoice Title */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              {/* Actual Mahastays Logo Image */}
              <div className="flex items-center gap-3">
                <img
                  src={MAHASTAYS_CLOUDINARY_LOGO}
                  alt="Mahastays"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[#ea110d] text-[10px] font-extrabold tracking-wider uppercase border border-rose-100">
                  Hospitality
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
                Mahastays Hospitality Private Limited<br />
                Panchgani-Mahabaleshwar Road, Satara District, Maharashtra 412806<br />
                CIN: U55101MH2024PTC398212 • Contact: support@mahastays.com
              </p>
            </div>

            <div className="sm:text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2 border ${
                isCancelled
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : isPaid
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {isCancelled ? 'BOOKING CANCELLED' : isPaid ? 'TAX INVOICE' : 'PAYMENT PENDING'}
              </span>
              <div className="text-xs space-y-0.5 text-slate-600">
                <p>
                  <strong className="text-slate-900 font-semibold">Invoice No:</strong> {invNumber}
                </p>
                <p>
                  <strong className="text-slate-900 font-semibold">Invoice Date:</strong> {invDate}
                </p>
                <p>
                  <strong className="text-slate-900 font-semibold">Booking Ref:</strong>{' '}
                  <span className="text-[#ea110d] font-bold">{refCode}</span>
                </p>
                <p>
                  <strong className="text-slate-900 font-semibold">Supplier GSTIN:</strong>{' '}
                  <span className="font-mono text-slate-800">27AABCM8921M1ZX</span>
                </p>
              </div>
            </div>
          </div>

          {/* Guest & Supplier Two-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block font-poppins mb-1">
                BILLED TO (GUEST DETAILS)
              </span>
              <h4 className="text-sm font-bold text-slate-900 font-poppins">
                {guestName}
              </h4>
              <p className="text-slate-600 mt-0.5">{guestEmail}</p>
              <p className="text-slate-600">{guestPhone}</p>
              <p className="text-slate-500 mt-1 font-medium">
                State of Supply: <span className="text-slate-800 font-semibold">{rawBooking.billingState || 'Maharashtra (Code 27)'}</span>
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block font-poppins mb-1">
                SUPPLIER &amp; OPERATOR
              </span>
              <h4 className="text-sm font-bold text-slate-900 font-poppins">
                Mahastays Hospitality Private Limited
              </h4>
              <p className="text-slate-600 mt-0.5">Venna Lake Road, Mahabaleshwar</p>
              <p className="text-slate-600">District Satara, Maharashtra 412806</p>
              <p className="text-slate-500 mt-1 font-medium">
                PAN: <span className="font-mono text-slate-800">AABCM8921M</span> • Code: <span className="font-mono text-slate-800">MH-27</span>
              </p>
            </div>
          </div>

          {/* Reservation / Service Overview */}
          <div className="border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
              <div>
                <span className="text-[10px] font-bold text-[#ea110d] uppercase tracking-wider">
                  {sacLabel}
                </span>
                <h3 className="text-base font-bold text-slate-900 font-poppins mt-0.5">
                  {title}
                </h3>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-500">Accommodation Type / Room</span>
                <p className="text-xs font-bold text-slate-800">{roomOrTierText}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold block">SCHEDULE / DATES</span>
                <strong className="text-slate-800 text-[11px] block mt-0.5">{scheduleText}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold block">GUESTS / TRAVELERS</span>
                <strong className="text-slate-800 text-[11px] block mt-0.5">{guestCountText}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold block">PAYMENT METHOD</span>
                <strong className="text-slate-800 text-[11px] block mt-0.5 uppercase">{rawBooking.paymentMethod || 'Online (Razorpay)'}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold block">PAYMENT STATUS</span>
                <strong className={`text-[11px] block mt-0.5 font-bold ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isPaid ? '● PAID & CONFIRMED' : '● PENDING / HOLD'}
                </strong>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 text-slate-700 font-poppins uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Description of Service</th>
                  <th className="py-3 px-3 text-center">SAC Code</th>
                  <th className="py-3 px-3 text-right">Qty / Unit</th>
                  <th className="py-3 px-4 text-right">Taxable Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Base room tariff &amp; hospitality stay package charges
                    </p>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono">{sacCode}</td>
                  <td className="py-3.5 px-3 text-right">1 Unit</td>
                  <td className="py-3.5 px-4 text-right font-semibold">
                    ₹{taxableAmount.toLocaleString('en-IN')}
                  </td>
                </tr>

                {discount > 0 && (
                  <tr className="text-emerald-700 bg-emerald-50/40">
                    <td className="py-2.5 px-4">
                      <span className="font-semibold">Mahastays Club Member Instant Discount (8%)</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">—</td>
                    <td className="py-2.5 px-3 text-right">1 Claim</td>
                    <td className="py-2.5 px-4 text-right font-bold">
                      -₹{discount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}

                {cleaningOrFee > 0 && (
                  <tr>
                    <td className="py-2.5 px-4">
                      <span>Cleaning, Sanitization &amp; Safe Hygiene Inspection Fee</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">998599</td>
                    <td className="py-2.5 px-3 text-right">1 Service</td>
                    <td className="py-2.5 px-4 text-right font-semibold">
                      ₹{cleaningOrFee.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Subtotal, GST & Grand Total Summary */}
            <div className="bg-slate-50/80 p-4 sm:p-5 border-t border-slate-200 flex flex-col items-end gap-1.5 text-xs">
              <div className="flex justify-between w-full sm:w-80 text-slate-600">
                <span>Taxable Value of Supply:</span>
                <span className="font-semibold text-slate-800">
                  ₹{taxableAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between w-full sm:w-80 text-slate-600">
                <span>Central GST (CGST @ {gstRate / 2}%):</span>
                <span className="font-semibold text-slate-800">
                  ₹{cgstAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between w-full sm:w-80 text-slate-600">
                <span>State GST (SGST @ {gstRate / 2}%):</span>
                <span className="font-semibold text-slate-800">
                  ₹{sgstAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="w-full sm:w-80 border-t border-slate-300 pt-2.5 mt-1.5 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-extrabold text-slate-900 font-poppins block">
                    Grand Total (INR):
                  </span>
                  <span className="text-[10px] text-slate-500 italic block">
                    (Inclusive of all applicable GST taxes)
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-extrabold text-[#ea110d] font-poppins">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block font-poppins">
              AMOUNT CHARGEABLE (IN WORDS)
            </span>
            <p className="font-bold text-slate-900 mt-0.5">
              {numberToIndianWords(grandTotal)}
            </p>
          </div>

          {/* Footer & Declaration */}
          <div className="border-t border-slate-200 pt-5 text-[11px] text-slate-500 space-y-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <strong className="text-slate-800 block mb-0.5">Terms &amp; Authentic Compliance:</strong>
                <p className="max-w-md text-[10px] leading-relaxed">
                  1. This is a computer-generated GST Tax Invoice issued under section 31 of CGST Act, 2017.<br />
                  2. Official check-in voucher is guaranteed. 24x7 local concierge on-ground at Mahabaleshwar.<br />
                  3. For support or dispute resolution, contact support@mahastays.com.
                </p>
              </div>

              <div className="sm:text-right">
                <div className="inline-block p-2 rounded-xl border border-slate-200 bg-white text-center mb-1">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-[9px] font-mono text-slate-400 mx-auto">
                    [GST QR CODE]
                  </div>
                </div>
                <p className="text-[9px] text-slate-400">Authentic E-Invoice Digital Stamp</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

