"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import api from "@/lib/api";
import BookingConfirmationView, { BookingConfirmationData } from "../../components/booking/BookingConfirmationView";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function SuccessClientContent() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";

  const [loading, setLoading] = useState<boolean>(true);
  const [confirmationData, setConfirmationData] = useState<BookingConfirmationData | null>(null);

  useEffect(() => {
    if (!refCode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get(`/bookings/reference/${encodeURIComponent(refCode)}`)
      .then((res) => {
        const payload = res.data?.data || res.data;
        if (!payload || !payload.booking) {
          throw new Error("Booking not found");
        }

        const b = payload.booking;
        const type = payload.bookingType || b.type || "stay";
        const payment = payload.payment || {};

        let title = b.title || "Luxury Stay & Spa";
        let checkInDate = b.checkInDate || b.schedule?.checkInDate || "Upcoming Check-in";
        let checkOutDate = b.checkOutDate || b.schedule?.checkOutDate || "Upcoming Check-out";
        let nights = b.nights || b.schedule?.nights || 1;
        let guestsText = `${b.adults || b.guests?.adults || 2} Adults${
          b.children || b.guests?.children ? `, ${b.children || b.guests?.children} Child` : ""
        }`;
        let roomOrTierText =
          b.roomName ||
          b.room?.roomName ||
          b.tierName ||
          b.tier?.tierName ||
          b.selectedTier?.name ||
          "Standard Accommodations";

        let image =
          b.image ||
          b.property?.images?.[0]?.url ||
          b.package?.thumbnail ||
          b.experience?.image ||
          "";

        let location =
          b.property?.city ||
          b.package?.city ||
          b.experience?.city ||
          "";

        if (type === "package") {
          title = b.package?.title || b.title || "Curated Getaway Package";
          checkInDate = b.startDate || checkInDate;
          checkOutDate = b.endDate || checkOutDate;
          guestsText = `${b.totalTravelers || b.travelers?.totalTravelers || 2} Travelers`;
        } else if (type === "experience") {
          title = b.experience?.title || b.title || "Guided Outdoor Experience";
          checkInDate = b.activityDate || checkInDate;
          checkOutDate = b.activityDate || checkOutDate;
          guestsText = `${b.totalParticipants || b.participants?.totalParticipants || 1} Participants`;
        }

        const isCancelled = b.bookingStatus === "cancelled";
        const isPayAtProperty =
          b.paymentMethod === "pay_at_property" ||
          b.paymentMethod === "Pay at Property" ||
          b.paymentStatus === "unpaid";

        const isPaid =
          !isCancelled &&
          !isPayAtProperty &&
          (payment.status === "captured" || b.paymentStatus === "paid");

        const totalAmount =
          Number(
            b.grandTotalInr ??
            b.pricing?.grandTotalInr ??
            b.pricing?.grandTotal ??
            b.totalAmountInr ??
            payment.amountInr ??
            b.amount ??
            0
          ) || 0;

        const amountActuallyPaid = isPaid ? totalAmount : 0;

        const bookedOn = b.createdAt
          ? new Date(b.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : undefined;

        setConfirmationData({
          bookingReference: b.bookingReference || refCode,
          invoiceNumber: isPaid && !isCancelled ? (payment.invoiceNumber || b.invoiceNumber) : undefined,
          bookingType: type,
          paymentStatus: isPaid ? "paid" : (b.paymentStatus || "unpaid"),
          bookingStatus: b.bookingStatus || "confirmed",
          title,
          image,
          rating: b.rating || b.property?.rating || undefined,
          reviewsCount: b.reviewsCount || b.property?.reviewsCount || undefined,
          location,
          checkInDate,
          checkInTime: "02:00 PM",
          checkOutDate,
          checkOutTime: "11:00 AM",
          nights,
          guestsText,
          roomOrTierText,
          totalAmount,
          amountPaid: amountActuallyPaid,
          amountDue: isPaid ? 0 : totalAmount,
          paymentMethod: isPayAtProperty
            ? "Pay at Property"
            : payment.method
            ? payment.method.toUpperCase()
            : b.paymentMethod || "Online Payment",
          bookedOnDate: bookedOn,
          pricing: b.pricing,
        });
      })
      .catch(() => {
        setConfirmationData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [refCode]);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 w-full pt-20 sm:pt-24 pb-16 bg-white overflow-x-hidden">
        {loading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-9 h-9 text-[#ea110d] animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Retrieving confirmed booking details...</p>
          </div>
        ) : confirmationData ? (
          <BookingConfirmationView data={confirmationData} />
        ) : (
          <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-slate-200 text-center shadow-xs">
            <p className="text-sm font-bold text-slate-800">No booking reference found.</p>
            <p className="text-xs text-slate-500 mt-1">Check your profile history for confirmed reservations.</p>
            <Link
              href="/profile?tab=bookings"
              className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-[#ea110d] text-white text-xs font-bold font-poppins shadow-xs"
            >
              Go to My Bookings
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#ea110d] animate-spin" />
        </div>
      }
    >
      <SuccessClientContent />
    </Suspense>
  );
}

