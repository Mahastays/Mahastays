'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '@/lib/api';
import BookingInvoiceModal, { BookingInvoiceData } from '../../components/booking/BookingInvoiceModal';

export default function InvoiceViewClient({ refCode }: { refCode: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingInvoiceData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!refCode) return;
    setLoading(true);
    setError(null);

    api
      .get(`/bookings/reference/${encodeURIComponent(refCode)}`)
      .then((res) => {
        const data = res.data?.data || res.data;
        if (!data || !data.booking) {
          setError('Booking record could not be found.');
          return;
        }

        const b = data.booking;
        const type = data.bookingType || b.type || 'stay';
        const payment = data.payment || {};

        let title = b.title || 'Mahastays Reservation';
        let dates = 'Upcoming';
        let guests = `${b.adults || 2} Adults`;
        let roomOrTierName = b.room?.roomName || b.tier?.tierName || b.selectedTier?.name || 'Standard Tier';

        if (type === 'stay') {
          title = b.property?.name || b.title || 'Luxury Resort & Villa';
          dates = `${b.schedule?.checkInDate || b.checkInDate || ''} - ${b.schedule?.checkOutDate || b.checkOutDate || ''}`;
          guests = `${b.guests?.adults || b.adults || 2} Adults, ${b.guests?.children || b.children || 0} Children`;
        } else if (type === 'package') {
          title = b.package?.title || b.title || 'All-Inclusive Tour Package';
          dates = `${b.startDate || ''} to ${b.endDate || ''}`;
          guests = `${b.travelers?.adults || b.adults || 2} Adults`;
        } else {
          title = b.experience?.title || b.title || 'Outdoor Activity';
          dates = `${b.activityDate || ''} (${b.selectedSlot?.time || b.slotTime || 'Scheduled'})`;
          guests = `${b.participants?.adults || b.adults || 1} Participants`;
        }

        const invoiceData: BookingInvoiceData = {
          id: b.id,
          bookingReference: b.bookingReference || refCode,
          bookingType: type,
          invoiceNumber: payment.invoiceNumber || b.invoiceNumber,
          createdAt: b.createdAt || payment.capturedAt,
          guestName: b.customer?.fullName || b.guestName || 'Valued Guest',
          guestEmail: b.customer?.email || b.guestEmail || '',
          guestPhone: b.customer?.phone?.nationalNumber || b.guestPhone || '',
          billingState: b.billingState || 'Maharashtra',
          paymentStatus: payment.status || b.paymentStatus || 'paid',
          paymentMethod: payment.method || b.paymentMethod || 'online',
          bookingStatus: b.bookingStatus || 'confirmed',
          title,
          dates,
          guests,
          roomOrTierName,
          amount: b.pricing?.grandTotalInr || b.grandTotalInr || b.pricing?.grandTotal || payment.amountInr || 0,
          pricing: b.pricing,
        };

        setBookingData(invoiceData);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not retrieve booking details for invoice generation.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [refCode]);

  const isPaid = bookingData?.paymentStatus === 'paid';
  const isCancelled = bookingData?.bookingStatus === 'cancelled';

  const handleDownloadPdf = async () => {
    if (!bookingData || !isPaid || isCancelled) return;
    setIsDownloading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const downloadUrl = `${apiBase}/bookings/invoice/ref/${encodeURIComponent(bookingData.bookingReference)}`;
      const res = await fetch(downloadUrl);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Mahastays-Invoice-${bookingData.bookingReference}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.message || 'Invoice PDF is not available.');
      }
    } catch {
      alert('Failed to connect to invoice server.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Loader2 className="w-8 h-8 text-[#ea110d] animate-spin mb-3" />
          <p className="text-sm text-slate-500 font-medium">Generating official GST Tax Invoice…</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-poppins">Invoice Not Available</h2>
          <p className="text-xs text-slate-500">
            {error || `We couldn't retrieve the reservation invoice for reference ${refCode}.`}
          </p>
          <Link
            href="/profile?tab=bookings"
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-[#ea110d] transition"
          >
            ← View My Bookings
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar />
        <main className="max-w-md mx-auto w-full px-4 pt-32 pb-16 flex-1 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-poppins">Booking Cancelled — No Tax Invoice</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Booking reference <strong className="text-slate-800">{bookingData.bookingReference}</strong> was cancelled. In accordance with government GST regulations, official tax invoices are not issued or generated for cancelled bookings.
          </p>
          <div className="pt-2">
            <Link
              href="/profile?tab=bookings"
              className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-[#ea110d] transition"
            >
              ← Back to My Bookings
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isPaid) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar />
        <main className="max-w-md mx-auto w-full px-4 pt-32 pb-16 flex-1 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-poppins">Payment Pending — Tax Invoice Not Generated</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Booking reference <strong className="text-slate-800">{bookingData.bookingReference}</strong> is currently unpaid ({bookingData.paymentMethod === 'pay_at_property' ? 'Pay at Property' : 'Pending'}). Official GST Tax Invoices are generated only after payment is captured and verified.
          </p>
          <div className="pt-2">
            <Link
              href={`/checkout/success?ref=${bookingData.bookingReference}`}
              className="inline-block px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition"
            >
              View Booking Voucher
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-28 sm:pt-32 pb-16 flex-1 print:p-0 print:m-0 print:max-w-none">
        {/* Top Navigation & Action Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#ea110d] font-poppins transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Reservations</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-800 text-slate-800 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs font-bold shadow-sm shadow-red-500/20 transition cursor-pointer disabled:opacity-60"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isDownloading ? 'Downloading...' : 'Download PDF Invoice'}</span>
            </button>
          </div>
        </div>

        {/* Invoice Modal Container rendered inline */}
        <BookingInvoiceModal
          isOpen={true}
          onClose={() => router.back()}
          booking={bookingData}
        />
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
