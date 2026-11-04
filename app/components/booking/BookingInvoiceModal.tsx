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

export interface BookingInvoiceData {
  id: string;
  bookingReference: string;
  bookingType: 'stay' | 'package' | 'experience';
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
  image?: string;
  dates?: string;
  startDate?: string;
  endDate?: string;
  nights?: number;
  guests?: string;
  adults?: number;
  children?: number;
  roomOrTierName?: string;
  timeSlot?: string;
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
    grandTotalInr?: number;
  };
}

interface BookingInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingInvoiceData | null;
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

  const isCancelled = booking.bookingStatus === 'cancelled';
  const isPaid = !isCancelled && (booking.paymentStatus === 'paid' || booking.paymentStatus === 'captured');

  const invNumber = isCancelled
    ? 'NO INVOICE (CANCELLED)'
    : isPaid
    ? (booking.invoiceNumber || `INV-${new Date(booking.createdAt || Date.now()).getFullYear()}-${booking.bookingReference.replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase()}`)
    : 'PENDING PAYMENT';

  const invDate = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  const isStay = booking.bookingType === 'stay';
  const isPackage = booking.bookingType === 'package';
  const isExperience = booking.bookingType === 'experience';

  // Specific SAC codes as per Indian GST law
  // 996311: Hotel, camp-site, villa accommodation services
  // 998555: Tour operator services for all-inclusive travel packages
  // 999692: Recreational, cultural, and sporting activity services
  const sacCode = isStay ? '996311' : isPackage ? '998555' : '999692';
  const sacLabel = isStay
    ? 'Short-Stay Accommodation Services (SAC 996311)'
    : isPackage
    ? 'Curated Holiday Tour Package Services (SAC 998555)'
    : 'Guided Outdoor Experience & Adventure Activity (SAC 999692)';

  // Ledger calculation with fallbacks
  const pricing = booking.pricing || {};
  const grandTotal =
    pricing.grandTotalInr ||
    pricing.grandTotal ||
    booking.amount ||
    12499;

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
      alert(isCancelled ? 'Invoice cannot be downloaded for cancelled bookings.' : 'Invoice is not available for unpaid bookings.');
      return;
    }
    setIsDownloading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const downloadUrl = `${apiBase}/bookings/invoice/ref/${encodeURIComponent(booking.bookingReference)}`;

      // Attempt backend stream download
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
        // Fallback: trigger print dialog (user can choose Save as PDF)
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
              Official GST Tax Invoice • {booking.bookingReference}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition shadow-xs"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading || !isPaid || isCancelled}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs font-bold cursor-pointer transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              title={isCancelled ? 'No invoice for cancelled bookings' : !isPaid ? 'Invoice available after payment' : 'Download PDF'}
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
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
        {/* PRINTABLE INVOICE BODY                                        */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div ref={printRef} className="p-6 sm:p-10 font-sans space-y-6 print:p-6 bg-white">
          {/* Header: Brand & Invoice Title */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="https://res.cloudinary.com/vxtop5jd/image/upload/v1793725764/mahastays/brand/mahastays-logo.png"
                  alt="Mahastays"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[#ea110d] text-[10px] font-extrabold tracking-wider uppercase border border-rose-100">
                  Hospitality
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
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
                  <span className="text-[#ea110d] font-bold">{booking.bookingReference}</span>
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
                {booking.guestName || 'Valued Guest'}
              </h4>
              <p className="text-slate-600 mt-0.5">{booking.guestEmail || 'customer@mahastays.com'}</p>
              {booking.guestPhone && <p className="text-slate-600">Phone: +91 {booking.guestPhone}</p>}
              <p className="text-slate-600">
                State of Supply:{' '}
                <strong className="text-slate-800 font-medium">
                  {booking.billingState || 'Maharashtra (State Code: 27)'}
                </strong>
              </p>
            </div>

            <div className="sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block font-poppins mb-1">
                RESERVATION &amp; PAYMENT STATUS
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isPaid ? 'Payment Captured (Paid)' : 'Pay at Property (Pending)'}</span>
                </span>
              </div>
              <p className="text-slate-600 mt-2">
                Payment Mode:{' '}
                <strong className="text-slate-900 uppercase">
                  {booking.paymentMethod || (isPaid ? 'UPI / Online' : 'Pay on Arrival')}
                </strong>
              </p>
              <p className="text-slate-600">
                Place of Supply: <strong className="text-slate-800">Mahabaleshwar, Maharashtra</strong>
              </p>
            </div>
          </div>

          {/* Specific Booking Particulars Card */}
          <div className="rounded-2xl border border-slate-200 p-4 sm:p-5 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ea110d] block font-poppins">
                  {booking.bookingType.toUpperCase()} RESERVATION PARTICULARS
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                  {booking.title}
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium sm:text-right">
                {sacLabel}
              </span>
            </div>

            {/* Stay Particulars */}
            {isStay && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Room / Suite</span>
                  <span className="font-semibold text-slate-900">
                    {booking.roomOrTierName || 'Luxury View Room'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Check-In</span>
                  <span className="font-semibold text-slate-900">
                    {booking.startDate || (booking.dates ? booking.dates.split('-')[0]?.trim() : 'Scheduled')} (01:00 PM)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Check-Out</span>
                  <span className="font-semibold text-slate-900">
                    {booking.endDate || (booking.dates ? booking.dates.split('-')[1]?.trim() : 'Scheduled')} (11:00 AM)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Duration &amp; Guests</span>
                  <span className="font-semibold text-slate-900">
                    {booking.nights || 2} Nights • {booking.guests || `${booking.adults || 2} Adults`}
                  </span>
                </div>
              </div>
            )}

            {/* Package Particulars */}
            {isPackage && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Selected Tier</span>
                  <span className="font-semibold text-slate-900">
                    {booking.roomOrTierName || 'Deluxe All-Inclusive'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Tour Start</span>
                  <span className="font-semibold text-slate-900">{booking.dates || 'Scheduled Date'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Itinerary</span>
                  <span className="font-semibold text-slate-900">3 Days / 2 Nights All-Inclusive</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Travelers</span>
                  <span className="font-semibold text-slate-900">{booking.guests || '2 Travelers'}</span>
                </div>
              </div>
            )}

            {/* Experience Particulars */}
            {isExperience && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Activity Phase</span>
                  <span className="font-semibold text-slate-900">Guided Nature &amp; Trail Excursion</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Date</span>
                  <span className="font-semibold text-slate-900">{booking.dates || 'Scheduled Date'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Time Slot</span>
                  <span className="font-semibold text-slate-900">
                    {booking.timeSlot || '06:00 AM – 09:30 AM (Sunrise)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Participants</span>
                  <span className="font-semibold text-slate-900">{booking.guests || '1 Participant'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Itemized Table of Charges */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 font-poppins">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Item &amp; Description</th>
                  <th className="py-3 px-4 text-center">SAC Code</th>
                  <th className="py-3 px-4 text-center">Qty / Days</th>
                  <th className="py-3 px-4 text-right">Taxable Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                <tr>
                  <td className="py-3 px-4 text-slate-400 font-mono">1</td>
                  <td className="py-3 px-4">
                    <strong className="text-slate-900 block font-semibold">
                      {booking.title} — {booking.roomOrTierName || (isStay ? 'Room Booking' : 'Package Pass')}
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      {isStay
                        ? `Stay accommodation charges for ${booking.nights || 2} nights`
                        : isPackage
                        ? 'Curated tour package passes with guided sightseeing'
                        : 'Adventure activities pass with certified mountain guide'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-600">{sacCode}</td>
                  <td className="py-3 px-4 text-center text-slate-600">
                    {isStay ? `${booking.nights || 2} Nights` : '1 Booking'}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    ₹{taxableAmount.toLocaleString('en-IN')}
                  </td>
                </tr>

                {discount > 0 && (
                  <tr className="bg-emerald-50/40 text-emerald-800">
                    <td className="py-2.5 px-4 text-slate-400 font-mono">2</td>
                    <td className="py-2.5 px-4 font-medium" colSpan={3}>
                      Mahastays Gold Club Member Instant Discount (8%)
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                      -₹{discount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}

                {cleaningOrFee > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 text-slate-400 font-mono">3</td>
                    <td className="py-2.5 px-4" colSpan={3}>
                      {isStay ? 'Cleaning & Sanitisation Protocol Fee' : 'Safety Gear & Trail Insurance Fee'}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-800">
                      ₹{cleaningOrFee.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Financial Summary Ledger */}
            <div className="bg-slate-50/70 border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row justify-between gap-6 text-xs">
              <div className="space-y-2 max-w-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-poppins">
                  AMOUNT IN WORDS
                </span>
                <p className="font-semibold text-slate-800 leading-relaxed font-roboto">
                  {numberToIndianWords(grandTotal)}
                </p>
                <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                  <p>• GST calculated under section 9 of the CGST/SGST Act.</p>
                  <p>• SAC Code {sacCode} applies to this hospitality transaction.</p>
                </div>
              </div>

              <div className="w-full sm:w-72 space-y-1.5 font-medium">
                <div className="flex justify-between text-slate-600">
                  <span>Net Taxable Value:</span>
                  <span className="text-slate-900 font-semibold">₹{taxableAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>CGST ({gstRate / 2}%):</span>
                  <span>₹{cgstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST ({gstRate / 2}%):</span>
                  <span>₹{sgstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex items-baseline justify-between text-sm sm:text-base font-extrabold text-slate-900 font-poppins">
                  <span>Total Invoice Value:</span>
                  <span className="text-lg sm:text-xl text-[#ea110d]">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Terms & Verification Note */}
          <div className="border-t border-slate-200 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center gap-1.5 justify-center sm:justify-start text-emerald-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Verified Mahastays Safe Booking Guarantee</span>
              </div>
              <p>
                For cancellation &amp; modification policies, visit mahastays.com/terms. Free cancellation up to 48 hours prior.
              </p>
            </div>

            <div className="text-center sm:text-right shrink-0">
              <div className="border-b border-slate-300 w-36 pb-1 mx-auto sm:ml-auto">
                <span className="font-serif italic font-bold text-slate-700 block text-xs">Mahastays Ops</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Authorised Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
