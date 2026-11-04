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
  Sparkles,
  ChevronRight,
  Send,
  Coffee,
} from "lucide-react";
import { toast } from "../../../components/ui/Toast";
import BookingInvoiceModal, { BookingInvoiceData } from "./BookingInvoiceModal";
import PaymentSuccessLottie from "./PaymentSuccessLottie";

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
  amountPaid: number;
  paymentMethod: string;
  cancellationDateText?: string;
  bookedOnDate?: string;
  guestName?: string;
  guestEmail?: string;
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

  const isCancelled = data.bookingStatus === 'cancelled';
  const isPaid =
    !isCancelled &&
    data.paymentStatus === 'paid' &&
    data.paymentMethod !== 'Pay at Property' &&
    data.paymentMethod !== 'pay_at_property' &&
    Boolean(data.invoiceNumber);

  return (
    <div className="w-full">
      {/* ─── Top Celebration Banner ─── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-100/90 via-teal-50 to-emerald-100/90 border-b border-emerald-200/80 py-8 sm:py-10 px-4 sm:px-6">
        {/* Decorative Sparkle Icons in Corners */}
        <div className="absolute top-3 left-4 text-emerald-400/70 pointer-events-none">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
        </div>
        <div className="absolute bottom-3 left-10 text-emerald-500/40 pointer-events-none">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="absolute top-4 right-8 text-emerald-400/70 pointer-events-none">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div className="absolute bottom-2 right-4 text-emerald-500/40 pointer-events-none">
          <Sparkles className="w-4 h-4" />
        </div>

        <div className="max-w-6xl mx-auto flex items-center gap-4 sm:gap-5 relative z-10">
          {/* Lottie Animated Payment Success Badge */}
          <div className="shrink-0 flex items-center justify-center">
            <PaymentSuccessLottie size={64} className="w-14 h-14 sm:w-16 sm:h-16" loop={false} />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-poppins tracking-tight">
              Booking Confirmed!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
              Thanks for choosing us, you will get email confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Main 2-Column Content ─── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* ═════════ LEFT COLUMN (Property Info, Amount, Important Info) ═════════ */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Property / Stay Details */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                {/* Thumbnail Image */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-slate-100 shadow-2xs border border-slate-100">
                  <img
                    src={defaultImage}
                    alt={data.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Title & Metadata */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-poppins leading-snug">
                    {data.title}
                  </h2>

                  {/* Rating row */}
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
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-[#ea110d] shrink-0" />
                      <span className="truncate">{locationText}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-slate-400" />
                  <span>Free WiFi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-400" />
                  <span>Free Parking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>Key Access</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-slate-400" />
                  <span>Air Conditioning</span>
                </div>
              </div>

              {/* Schedule and Guests Divider */}
              <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                {/* Check In */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block font-poppins">
                    CHECK-IN
                  </span>
                  <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                    {data.checkInDate}
                  </p>
                  <p className="text-xs text-slate-500">{data.checkInTime || "02:00 PM"}</p>
                </div>

                {/* Duration Badge */}
                <div className="flex justify-start sm:justify-center">
                  <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200/80 shadow-2xs">
                    {nightsDisplay}
                  </span>
                </div>

                {/* Check Out */}
                <div className="sm:text-right">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block font-poppins">
                    CHECK-OUT
                  </span>
                  <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                    {data.checkOutDate}
                  </p>
                  <p className="text-xs text-slate-500">{data.checkOutTime || "11:00 AM"}</p>
                </div>
              </div>

              {/* Guest & Room Breakdown Pill */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
                <span className="font-semibold">{data.guestsText}</span>
                <span className="font-bold text-slate-900 font-poppins">
                  {data.roomOrTierText}
                </span>
              </div>
            </div>

            {/* Card 2: Amount Paid */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base font-bold text-slate-800">
                  Amount Paid
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-poppins tracking-tight">
                  ₹{data.amountPaid.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                <span>Paid via</span>
                <span className="font-bold text-slate-800 uppercase tracking-wide">
                  {data.paymentMethod}
                </span>
              </div>

              {/* Purple Free Cancellation Pill */}
              <div className="bg-purple-50/90 border border-purple-100 text-purple-900 p-3.5 rounded-2xl flex items-center gap-3 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <p className="leading-snug">{cancellationText}</p>
              </div>
            </div>

            {/* Card 3: Important Information */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins mb-3">
                Important Information
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed list-disc list-inside">
                <li>
                  For smooth check-in at Mahastays verified properties, please present a valid
                  Government Photo ID (Aadhaar Card, Passport, or Driving License).
                </li>
                <li>
                  GST tax invoice can be collected directly from the property or downloaded here
                  anytime.
                </li>
                <li>
                  Special guest requests (early check-in, extra bedding, bonfire, dietary preference)
                  have been logged and forwarded directly to the property caretaker.
                </li>
              </ul>
            </div>
          </div>

          {/* ═════════ RIGHT COLUMN (Booking Details, Support, Feedback) ═════════ */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 1: Booking Details & Action CTAs */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins">
                Booking Details
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
                    <span>Pending Payment</span>
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
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs font-bold font-poppins shadow-sm transition cursor-pointer"
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
                ) : isCancelled ? (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium text-center space-y-1">
                    <div className="font-bold">Booking Cancelled</div>
                    <div className="text-[11px] text-rose-600">In accordance with tax regulations, tax invoices are not issued for cancelled bookings.</div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium text-center space-y-1">
                    <div className="font-bold">Payment Pending at Property</div>
                    <div className="text-[11px] text-amber-700">Official GST Tax Invoice will be issued upon check-in payment.</div>
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

            {/* Card 2: Have Questions? Support Box */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex items-center justify-between gap-3 relative overflow-hidden">
              <div className="flex-1 pr-2">
                <h4 className="text-sm font-bold text-slate-900 font-poppins">Have Questions?</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Our friendly customer support team is your extended family.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs">
                  <a
                    href="tel:+917741002157"
                    className="font-bold text-[#ea110d] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Call: 7741002157</span>
                  </a>
                  <span className="text-slate-300">·</span>
                  <a
                    href="https://wa.me/919405419021"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Friendly Customer Concierge Graphic */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 relative flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-2xs">
                  <svg
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10"
                  >
                    {/* Head / Face */}
                    <circle cx="32" cy="24" r="14" fill="#FCD34D" />
                    {/* Headset arc */}
                    <path
                      d="M16 26C16 16 23 10 32 10C41 10 48 16 48 26"
                      stroke="#0284C7"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Headset earpads */}
                    <rect x="14" y="22" width="4" height="10" rx="2" fill="#0369A1" />
                    <rect x="46" y="22" width="4" height="10" rx="2" fill="#0369A1" />
                    {/* Microphone */}
                    <path
                      d="M48 28C48 36 40 40 34 40"
                      stroke="#0369A1"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="34" cy="40" r="2.5" fill="#0F172A" />
                    {/* Smile */}
                    <path
                      d="M27 28C29 31 35 31 37 28"
                      stroke="#78350F"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    {/* Eyes */}
                    <circle cx="27" cy="22" r="1.5" fill="#78350F" />
                    <circle cx="37" cy="22" r="1.5" fill="#78350F" />
                    {/* Torso */}
                    <path
                      d="M18 54C18 44 24 40 32 40C40 40 46 44 46 54"
                      fill="#0284C7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card 3: Feedback Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
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
                    placeholder="Share your feedback!"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#ea110d] transition"
                  />

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-2 px-4 rounded-xl border border-slate-300 hover:border-slate-800 text-slate-800 hover:bg-slate-50 text-xs font-bold font-poppins transition cursor-pointer"
                  >
                    Submit
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
          bookingType: data.bookingType || "stay",
          invoiceNumber: data.invoiceNumber,
          title: data.title,
          dates: `${data.checkInDate} to ${data.checkOutDate}`,
          guests: data.guestsText,
          roomOrTierName: data.roomOrTierText,
          amount: data.amountPaid,
          paymentStatus: "paid",
          bookingStatus: "confirmed",
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          pricing: data.pricing,
        }}
      />
    </div>
  );
}

