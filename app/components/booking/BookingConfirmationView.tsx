"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  Star,
  MapPin,
  Wifi,
  Car,
  Key,
  Wind,
  ShieldCheck,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Headphones,
  Phone,
  MessageCircle,
  CreditCard,
  Building,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "../../../components/ui/Toast";
import BookingInvoiceModal from "./BookingInvoiceModal";

export interface BookingConfirmationData {
  bookingReference: string;
  invoiceNumber?: string;
  bookingType?: "stay" | "package" | "experience";
  paymentStatus?: string;
  bookingStatus?: string;
  title: string;
  image?: string;
  rating?: number;
  reviewsCount?: number;
  location?: string;
  amenities?: string[];
  checkInDate: string;
  checkInTime?: string;
  checkOutDate: string;
  checkOutTime?: string;
  nights?: number;
  guestsText: string;
  roomOrTierText: string;
  totalAmount?: number;
  amountPaid: number;
  amountDue?: number;
  paymentMethod: string;
  cancellationDateText?: string;
  bookedOnDate?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;
  notes?: string;
  pricing?: any;
}

interface BookingConfirmationViewProps {
  data: BookingConfirmationData;
}

export default function BookingConfirmationView({ data }: BookingConfirmationViewProps) {
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>("");
  const [submittedFeedback, setSubmittedFeedback] = useState<boolean>(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  const handleCopyReference = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(data.bookingReference);
      setCopiedRef(true);
      toast.success("Booking ID copied to clipboard!");
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast.info("Please enter a short review before submitting.");
      return;
    }
    setSubmittedFeedback(true);
    toast.success("Thank you for your valuable feedback!", "Review Submitted");
  };

  const invoiceDownloadUrl = `${
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"
  }/bookings/invoice/ref/${encodeURIComponent(data.bookingReference)}`;

  // Real data values (leave blank/hidden if not provided)
  const ratingScore = data.rating || null;
  const reviewsCount = data.reviewsCount || 0;
  const locationText = data.location || "";
  const defaultImage = data.image || "";

  const nightsDisplay =
    data.nights && data.nights > 0
      ? `${data.nights} Night${data.nights > 1 ? "s" : ""}`
      : "Confirmed Stay";

  const bookedOnText =
    data.bookedOnDate ||
    new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const cancellationText =
    data.cancellationDateText ||
    `Your property allows free cancellation (100% refund) up to 48 hours before check-in.`;

  const isCancelled = data.bookingStatus === "cancelled";

  const isPayAtProperty =
    data.paymentMethod?.toLowerCase().includes("property") ||
    data.paymentMethod === "pay_at_property" ||
    data.paymentStatus === "unpaid" ||
    data.paymentStatus === "pending";

  const isPaid =
    !isCancelled &&
    !isPayAtProperty &&
    (data.paymentStatus === "paid" || data.paymentStatus === "captured") &&
    Boolean(data.invoiceNumber || data.amountPaid > 0);

  const totalPayableAmount =
    data.totalAmount ??
    data.amountPaid ??
    data.pricing?.grandTotalInr ??
    data.pricing?.grandTotal ??
    0;

  return (
    <div className="w-full bg-white">
      {/* ─── Top Celebration & Confirmation Header ─── */}
      <div className="border-b border-slate-100 bg-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center shrink-0 text-emerald-600">
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-poppins tracking-tight">
                  Booking Confirmed!
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isPaid
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : "bg-amber-50 text-amber-700 border border-amber-200/60"
                  }`}
                >
                  {isPaid ? "Paid & Confirmed" : "Pay at Property"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {isPaid
                  ? "Thank you for choosing Mahastays. A confirmation receipt and check-in voucher have been sent to your email."
                  : "Thank you for choosing Mahastays. Your reservation is confirmed with the host; payment will be collected at check-in."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleCopyReference}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              title="Copy Booking ID"
            >
              {copiedRef ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>ID: {data.bookingReference}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main 2-Column Content ─── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* ═════════ LEFT COLUMN (Stay Info, Payment Status, Guidelines) ═════════ */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Property / Stay Details */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-7 shadow-xs">
              <div className="flex flex-row items-start gap-3.5 sm:gap-5">
                {/* Thumbnail Image */}
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 bg-slate-100 border border-slate-100">
                  <img
                    src={defaultImage || "https://images.unsplash.com/photo-1613490493576-7fde63acd811"}
                    alt={data.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Title & Metadata */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-xl font-bold text-slate-900 font-poppins leading-snug">
                    {data.title}
                  </h2>

                  {/* Rating row (only shown if real rating exists) */}
                  {ratingScore ? (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                      <div className="flex items-center text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < Math.round(Number(ratingScore))
                                ? "fill-amber-400 text-amber-400"
                                : "fill-amber-200 text-amber-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-slate-700">{ratingScore}</span>
                      {reviewsCount > 0 && <span className="text-slate-400">({reviewsCount} reviews)</span>}
                    </div>
                  ) : null}

                  {/* Location row */}
                  {locationText && (
                    <div className="flex items-center gap-1.5 mt-1.5 sm:mt-2 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">{locationText}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities row */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 pt-3.5 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Free High-Speed Wi-Fi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>On-Site Parking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Direct Check-in</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Air Conditioning</span>
                </div>
              </div>

              {/* Schedule and Duration Grid */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 sm:gap-4 items-center">
                {/* Check In */}
                <div>
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block font-poppins">
                    CHECK-IN
                  </span>
                  <p className="text-xs sm:text-base font-bold text-slate-900 mt-0.5 truncate">
                    {data.checkInDate}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500">{data.checkInTime || "02:00 PM"}</p>
                </div>

                {/* Duration Badge */}
                <div className="flex justify-center">
                  <span className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px] sm:text-xs border border-slate-200/80 whitespace-nowrap">
                    {nightsDisplay}
                  </span>
                </div>

                {/* Check Out */}
                <div className="text-right">
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block font-poppins">
                    CHECK-OUT
                  </span>
                  <p className="text-xs sm:text-base font-bold text-slate-900 mt-0.5 truncate">
                    {data.checkOutDate}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500">{data.checkOutTime || "11:00 AM"}</p>
                </div>
              </div>

              {/* Guest & Room Breakdown Pill */}
              <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
                <span className="font-semibold">{data.guestsText}</span>
                <span className="font-bold text-slate-900 font-poppins">
                  {data.roomOrTierText}
                </span>
              </div>
            </div>

            {/* Card 2: Payment Status & Breakdown */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
              {isPaid ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Payment Status
                      </span>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">Amount Paid Online</div>
                    </div>
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-poppins tracking-tight">
                      ₹{data.amountPaid.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pb-1 pt-2 border-t border-slate-100">
                    <span className="text-slate-400">Payment Mode</span>
                    <span className="font-bold text-slate-800 uppercase tracking-wide">
                      {data.paymentMethod || "Online Gateway"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                          Payment Pending (Pay at Property)
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-800 mt-1">Total Amount Payable</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-poppins tracking-tight">
                        ₹{totalPayableAmount.toLocaleString("en-IN")}
                      </span>
                      <div className="text-[11px] text-amber-600 font-medium">Due at Check-in</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-800 space-y-1">
                    <div className="font-bold">No online payment was deducted.</div>
                    <div className="text-[11px] text-amber-700">
                      Please pay ₹{totalPayableAmount.toLocaleString("en-IN")} directly upon arrival at the property reception via Cash, UPI, or Card.
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pb-1 pt-2 border-t border-slate-100">
                    <span className="text-slate-400">Selected Method</span>
                    <span className="font-bold text-slate-800">
                      Pay at Property (Front Desk Settlement)
                    </span>
                  </div>
                </>
              )}

              {/* Professional Cancellation Policy Pill */}
              <div className="bg-slate-50 border border-slate-200/70 text-slate-700 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl flex items-start sm:items-center gap-2.5 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                <p className="leading-snug">{cancellationText}</p>
              </div>
            </div>

            {/* Lead Guest & Special Requests Card */}
            {(data.guestPhone || data.specialRequests || data.notes) && (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins">
                    Lead Guest &amp; Preferences
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                    Saved in Profile &amp; Booking
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  {data.guestName && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Lead Guest</span>
                      <span className="font-bold text-slate-800 text-xs mt-0.5 block">{data.guestName}</span>
                    </div>
                  )}
                  {data.guestPhone && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Mobile Number</span>
                      <span className="font-bold text-slate-800 text-xs mt-0.5 block">+91 {data.guestPhone}</span>
                    </div>
                  )}
                </div>
                {(data.specialRequests || data.notes) && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                      Special Requests / Notes
                    </span>
                    <p className="text-xs text-slate-700 bg-amber-50/50 border border-amber-200/60 p-3 rounded-xl leading-relaxed italic">
                      &ldquo;{data.specialRequests || data.notes}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Card 3: Important Check-in Guidelines */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins mb-3">
                Important Check-in Guidelines
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed list-disc list-inside">
                <li>
                  For verified check-in, please present an official Government Photo ID (Aadhaar Card, Passport, or Driving License) for all adult guests.
                </li>
                <li>
                  Official GST tax invoice will be issued directly upon final payment clearance.
                </li>
                <li>
                  Special guest requests (early check-in, extra bedding, dietary requests) have been forwarded directly to the property host and caretaker.
                </li>
              </ul>
            </div>
          </div>

          {/* ═════════ RIGHT COLUMN (Booking Details, Support, Feedback) ═════════ */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 1: Booking Details & Action CTAs */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins">
                Booking Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Booking ID</span>
                  <span className="font-extrabold font-mono text-[#ea110d] text-sm">
                    {data.bookingReference}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Booked on</span>
                  <span className="font-semibold text-slate-800">{bookedOnText}</span>
                </div>

                {isPaid && data.invoiceNumber ? (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Invoice #</span>
                    <span className="font-mono font-medium text-slate-700">
                      {data.invoiceNumber}
                    </span>
                  </div>
                ) : isCancelled ? (
                  <div className="flex items-center justify-between text-xs text-rose-600 font-medium">
                    <span>Tax Invoice</span>
                    <span>No Invoice (Cancelled)</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-amber-700 font-medium">
                    <span>Tax Invoice</span>
                    <span>Issued at Check-in</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                {isPaid ? (
                  <>
                    <a
                      href={invoiceDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs font-bold font-poppins shadow-xs transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Receipt (PDF)</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setShowInvoiceModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:border-slate-800 text-slate-800 text-xs font-bold font-poppins transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#ea110d]" />
                      <span>View Tax Invoice</span>
                    </button>
                  </>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Payment Due at Check-in</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Official GST Tax Invoice will be generated upon check-in payment.
                    </div>
                  </div>
                )}

                <Link
                  href="/explore"
                  className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold font-poppins transition"
                >
                  Keep Exploring
                </Link>
              </div>
            </div>

            {/* Card 2: Professional Support Concierge */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                  <Headphones className="w-5 h-5 text-slate-800" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-poppins">Need Assistance?</h4>
                  <p className="text-xs text-slate-400">Our 24/7 guest concierge is ready to assist.</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <a
                  href="tel:+917741002157"
                  className="flex items-center gap-1.5 font-bold text-slate-800 hover:text-[#ea110d] transition"
                >
                  <Phone className="w-3.5 h-3.5 text-[#ea110d]" />
                  <span>Call: 7741002157</span>
                </a>
                <span className="text-slate-300">·</span>
                <a
                  href="https://wa.me/919405419021"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-bold text-emerald-600 hover:text-emerald-700 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Card 3: Guest Feedback */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 font-poppins">
                How was your experience?
              </h4>

              {submittedFeedback ? (
                <div className="py-4 text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-xs font-bold mb-2">
                    ✓
                  </div>
                  <p className="text-xs font-bold text-slate-800">Feedback Received!</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Thank you for helping us improve Mahastays.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                  {/* Interactive 5 Star Rating */}
                  <div className="flex items-center gap-1.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                        aria-label={`Rate ${star} star`}
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating
                              ? "fill-amber-400 text-amber-400"
                              : "fill-none text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Feedback Textbox */}
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share your feedback or suggestions..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500 transition"
                  />

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-2 px-4 rounded-xl border border-slate-300 hover:border-slate-800 text-slate-800 hover:bg-slate-50 text-xs font-bold font-poppins transition cursor-pointer"
                  >
                    Submit Review
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Official GST Tax Invoice Modal */}
      <BookingInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        booking={{
          id: data.bookingReference,
          bookingReference: data.bookingReference,
          bookingType: (data.bookingType as any) || "stay",
          invoiceNumber: data.invoiceNumber,
          title: data.title,
          dates: `${data.checkInDate} to ${data.checkOutDate}`,
          guests: data.guestsText,
          roomOrTierName: data.roomOrTierText,
          amount: data.amountPaid || totalPayableAmount,
          paymentStatus: isPaid ? "paid" : "unpaid",
          bookingStatus: "confirmed",
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          pricing: data.pricing,
        }}
      />
    </div>
  );
}
