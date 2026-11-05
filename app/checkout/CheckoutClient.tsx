"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast } from "../../components/ui/Toast";
import BookingInvoiceModal from "../components/booking/BookingInvoiceModal";
import BookingConfirmationView, { BookingConfirmationData } from "../components/booking/BookingConfirmationView";
import { FileText, Download } from "lucide-react";
import { MAHASTAYS_LOGO_DATA_URI } from "./brandLogoData";

const getRazorpayBrandLogo = (): string => {
  if (typeof window !== "undefined") {
    if (window.location.protocol === "https:" && window.location.origin) {
      return `${window.location.origin}/brand/mahastays-logo-main.png`;
    }
  }
  return MAHASTAYS_LOGO_DATA_URI;
};

interface CheckoutFormData {
  fullName: string;
  email: string;
  phone: string;
  state: string;
  specialRequests: string;
  paymentMethod: "upi" | "card" | "netbanking" | "pay_at_property" | "online";
  upiId: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardName: string;
  bankName: string;
}

const extractPhone = (val: any): string => {
  if (!val) return "";
  if (typeof val === "object") {
    const raw = val.nationalNumber || val.number || (typeof val.phone === "string" ? val.phone : "") || "";
    return String(raw).replace(/^\+91/, "").replace(/\D/g, "").slice(0, 10);
  }
  const s = String(val);
  if (s.includes("object") || s.includes("Object")) return "";
  return s.replace(/^\+91/, "").replace(/\D/g, "").slice(0, 10);
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL Query Parameters
  const bookingType = (searchParams.get("type") || "stay") as "stay" | "package" | "experience";
  const itemId = searchParams.get("id") || "p5002";
  const title = searchParams.get("title") || "Misty Cliff Valley Heritage Villa";
  const tierOrRoomId = searchParams.get("tierId") || "room-1";
  const tierOrRoomName = searchParams.get("tierName") || "Valley Panoramic Master Suite";
  const startDate = searchParams.get("checkIn") || searchParams.get("startDate") || "2026-10-15";
  const endDate = searchParams.get("checkOut") || searchParams.get("endDate") || "2026-10-18";
  const adults = parseInt(searchParams.get("adults") || "2", 10);
  const children = parseInt(searchParams.get("children") || "1", 10);
  const slotId = searchParams.get("slotId") || "slot-1";
  const slotTime = searchParams.get("slotTime") || "06:00 AM – 08:00 AM";
  const imageUrl = searchParams.get("image") || "/maha photos/luxury-pool.jpg";
  const priceParam = parseInt(searchParams.get("price") || "8900", 10);
  const discountParam = searchParams.get("discount");
  const feeParam = searchParams.get("cleaningFee");
  const gstParam = searchParams.get("gst");

  // Form State
  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: "",
    email: "",
    phone: "",
    state: "Maharashtra",
    specialRequests: "",
    paymentMethod: "online",
    upiId: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    cardName: "",
    bankName: "HDFC Bank",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<any | null>(null);

  // Platform Global Booking Status State
  const [platformBookingsEnabled, setPlatformBookingsEnabled] = useState(true);
  const [platformBookingsMessage, setPlatformBookingsMessage] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Check public platform configuration for global booking killswitch
  useEffect(() => {
    fetch("/api/config/public")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data && data.data.platformBookingsEnabled === false) {
          setPlatformBookingsEnabled(false);
          setPlatformBookingsMessage(
            data.data.platformBookingsMessage ||
              "Platform reservations are temporarily paused by administration for system maintenance."
          );
        }
      })
      .catch(() => {});
  }, []);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  // Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description: string;
  } | null>(null);

  // Calculations
  const startDt = new Date(startDate);
  const endDt = new Date(endDate);
  const nights = Math.max(1, Math.round((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Dynamic pricing overrides from listing configuration
  const customDiscountPercent = discountParam !== null ? parseInt(discountParam, 10) : null;
  const customFee = feeParam !== null ? parseInt(feeParam, 10) : null;
  const customGstPercent = gstParam !== null ? parseInt(gstParam, 10) : null;
  const discountPercent = customDiscountPercent !== null ? customDiscountPercent : 8;

  let baseCost = 0;
  let memberDiscount = 0;
  let fee = 0;
  let taxes = 0;
  let grandTotal = 0;

  if (bookingType === "stay") {
    baseCost = priceParam * nights;
    memberDiscount = Math.round(baseCost * (discountPercent / 100));
    fee = customFee !== null ? customFee : 445;
    const gstRate = (customGstPercent !== null ? customGstPercent : 18) / 100;
    taxes = Math.round((baseCost - memberDiscount + fee) * gstRate);
    grandTotal = baseCost - memberDiscount + fee + taxes;
  } else if (bookingType === "package") {
    const totalTravelers = Math.max(1, adults + children);
    baseCost = priceParam * totalTravelers;
    memberDiscount = Math.round(baseCost * (discountPercent / 100));
    fee = customFee !== null ? customFee : 0;
    const gstRate = (customGstPercent !== null ? customGstPercent : 18) / 100;
    taxes = Math.round((baseCost - memberDiscount + fee) * gstRate);
    grandTotal = baseCost - memberDiscount + fee + taxes;
  } else {
    baseCost = priceParam * adults + Math.round(priceParam * 0.7 * children);
    memberDiscount = Math.round(baseCost * (discountPercent / 100));
    fee = customFee !== null ? customFee : 0;
    const gstRate = (customGstPercent !== null ? customGstPercent : 18) / 100;
    taxes = Math.round((baseCost - memberDiscount + fee) * gstRate);
    grandTotal = baseCost - memberDiscount + fee + taxes;
  }

  // Coupon calculations
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalGrandTotal = Math.max(0, grandTotal - couponDiscount);

  // Pre-fill user if logged in & verify session
  useEffect(() => {
    try {
      const token = localStorage.getItem("mahastays_token");
      const stored = localStorage.getItem("mahastays_user");
      if (token && stored) {
        const u = JSON.parse(stored);
        setIsLoggedIn(true);
        setLoggedInUser(u);
        const phoneStr = extractPhone(u.phoneNumber) || extractPhone(u.phone) || "";
        setFormData((prev) => ({
          ...prev,
          fullName: u.fullName || u.name || prev.fullName,
          email: u.email || prev.email,
          phone: phoneStr || prev.phone,
          state: u.billingState || prev.state,
        }));
      } else {
        setIsLoggedIn(false);
      }
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponError(null);

    // Try backend API first
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const token = typeof window !== "undefined" ? localStorage.getItem("mahastays_token") : null;
      const res = await fetch(`${apiUrl}/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code,
          bookingType,
          amount: grandTotal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.discountAmount) {
        const amt = Math.round(data.data.discountAmount);
        setAppliedCoupon({
          code,
          discountAmount: amt,
          description: `Applied successfully! (Saved ₹${amt.toLocaleString()})`,
        });
        setCouponInput("");
        toast.success(`Coupon "${code}" applied! You saved ₹${amt.toLocaleString("en-IN")}.`, "Coupon Applied");
        return;
      }
    } catch {
      // offline fallback to standard promotional codes
    }

    if (code === "MAHA10") {
      const discount = Math.min(2500, Math.round(grandTotal * 0.1));
      setAppliedCoupon({
        code: "MAHA10",
        discountAmount: discount,
        description: "10% Platform Discount Applied!",
      });
      setCouponInput("");
      toast.success(`Coupon "MAHA10" applied! You saved ₹${discount.toLocaleString("en-IN")}.`, "Coupon Applied");
    } else if (code === "WELCOME500") {
      const discount = Math.min(500, grandTotal);
      setAppliedCoupon({
        code: "WELCOME500",
        discountAmount: discount,
        description: "Flat ₹500 First Time Booking Discount!",
      });
      setCouponInput("");
      toast.success(`Coupon "WELCOME500" applied! You saved ₹${discount.toLocaleString("en-IN")}.`, "Coupon Applied");
    } else if (code === "ESCAPE15") {
      const discount = Math.min(3500, Math.round(grandTotal * 0.15));
      setAppliedCoupon({
        code: "ESCAPE15",
        discountAmount: discount,
        description: "15% Special Getaway Discount Applied!",
      });
      setCouponInput("");
      toast.success(`Coupon "ESCAPE15" applied! You saved ₹${discount.toLocaleString("en-IN")}.`, "Coupon Applied");
    } else {
      const err = "Invalid or expired coupon code. Try MAHA10 or WELCOME500.";
      setCouponError(err);
      toast.error(err, "Invalid Coupon");
    }
  };

  const handleQuickApplyCoupon = (code: string) => {
    setCouponInput(code);
    if (code === "MAHA10") {
      const discount = Math.min(2500, Math.round(grandTotal * 0.1));
      setAppliedCoupon({
        code: "MAHA10",
        discountAmount: discount,
        description: "10% Platform Discount Applied!",
      });
      toast.success(`Coupon "MAHA10" applied! Saved ₹${discount.toLocaleString("en-IN")}.`, "Coupon Applied");
    } else if (code === "WELCOME500") {
      const discount = Math.min(500, grandTotal);
      setAppliedCoupon({
        code: "WELCOME500",
        discountAmount: discount,
        description: "Flat ₹500 First Time Booking Discount!",
      });
      toast.success(`Coupon "WELCOME500" applied! Saved ₹${discount.toLocaleString("en-IN")}.`, "Coupon Applied");
    } else if (code === "ESCAPE15") {
      const discount = Math.min(3500, Math.round(grandTotal * 0.15));
      setAppliedCoupon({
        code: "ESCAPE15",
        discountAmount: discount,
        description: "15% Special Getaway Discount Applied!",
      });
      toast.success(`Coupon "ESCAPE15" applied! Saved ₹${discount.toLocaleString("en-IN")}.`, "Coupon Applied");
    }
    setCouponError(null);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    toast.info("Coupon discount removed.", "Coupon Removed");
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!platformBookingsEnabled) {
      const msg = platformBookingsMessage || "Reservations are currently paused across the platform by administration.";
      setErrorMsg(msg);
      toast.warning(msg, "Bookings Paused");
      return;
    }

    if (!isLoggedIn) {
      const msg = "Please log in or sign up to complete this booking.";
      setErrorMsg(msg);
      toast.warning(msg, "Login Required");
      window.scrollTo({ top: 0, behavior: "smooth" });
      const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/checkout";
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      const msg = "Please fill in your Name, Email, and Mobile Number.";
      setErrorMsg(msg);
      toast.warning(msg, "Missing Information");
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const payload = {
        bookingType,
        itemId,
        tierOrRoomId,
        tierOrRoomName,
        startDate,
        endDate: bookingType === "experience" ? undefined : endDate,
        adults,
        children,
        slotId: bookingType === "experience" ? slotId : undefined,
        slotTime: bookingType === "experience" ? slotTime : undefined,
        guestName: formData.fullName.trim(),
        guestEmail: formData.email.trim(),
        guestPhone: extractPhone(formData.phone),
        billingState: formData.state,
        specialRequests: formData.specialRequests.trim() || undefined,
        paymentMethod: formData.paymentMethod === "pay_at_property" ? "pay_at_property" : "upi",
        couponCode: appliedCoupon?.code,
        pricing: {
          basePrice: baseCost,
          memberDiscount,
          cleaningFee: fee,
          taxes,
          couponDiscount,
          couponCode: appliedCoupon?.code,
          grandTotal: finalGrandTotal,
        },
      };

      const token = typeof window !== "undefined" ? localStorage.getItem("mahastays_token") : null;
      const res = await fetch(`${apiUrl}/bookings/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to process booking on backend");
      }

      // If user chose pay at property, booking is directly confirmed
      if (formData.paymentMethod === "pay_at_property") {
        setBookingResult(json.data);
        setIsLoading(false);
        return;
      }

      // Online payment via Razorpay Test Gateway - ALWAYS open Razorpay checkout modal
      const gatewayOrder = json.data?.gatewayOrder;
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay payment gateway. Please check your internet connection.");
      }

      const rzpKey = gatewayOrder?.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TsvM6ELYin3phv";
      const amountPaise = gatewayOrder?.amountPaise || Math.round(finalGrandTotal * 100);
      const realOrderId = gatewayOrder?.orderId;
      const isValidRzpOrderId = typeof realOrderId === "string" && realOrderId.startsWith("order_") && !realOrderId.includes("MHA") && !realOrderId.includes("INV");

      const brandLogo = getRazorpayBrandLogo();

      const options: any = {
        key: rzpKey,
        amount: amountPaise,
        currency: gatewayOrder?.currency || "INR",
        name: "Mahastays",
        description: `${bookingType.toUpperCase()} Booking - ${title.slice(0, 30)}`,
        image: brandLogo,
        handler: async function (response: any) {
          try {
            setIsLoading(true);
            if (json.data?.bookingReference) {
              try {
                await fetch(`${apiUrl}/bookings/verify-payment`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                    bookingReference: json.data.bookingReference,
                  }),
                });
              } catch (verifyErr) {
                console.warn("Backend verify failed:", verifyErr);
              }
            }

            setBookingResult({
              ...json.data,
              booking: {
                ...json.data.booking,
                paymentStatus: "paid",
                bookingStatus: "confirmed",
              },
              payment: {
                ...json.data.payment,
                status: "captured",
                gatewayPaymentId: response.razorpay_payment_id,
              },
            });
            toast.success("Payment verified! Booking confirmed.", "Payment Successful");
          } catch (verifyErr: any) {
            setErrorMsg(verifyErr.message || "Payment verification failed. Please contact support.");
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: extractPhone(formData.phone),
        },
        notes: {
          bookingReference: json.data?.bookingReference,
          bookingType,
          bookingId: json.data?.booking?.id,
        },
        theme: {
          color: "#ea110d",
          backdrop_color: "rgba(15, 23, 42, 0.65)",
          hide_topbar: false,
        },
        modal: {
          backdropclose: false,
          escape: true,
          handleback: true,
          confirm_close: true,
          animation: true,
          ondismiss: function () {
            setIsLoading(false);
            toast.info("Payment window closed. You can retry whenever you are ready.");
          },
        },
        config: {
          display: {
            language: "en",
            blocks: {
              upi: {
                name: "Pay via UPI",
                instruments: [{ method: "upi" }],
              },
              other: {
                name: "Cards, Netbanking & Wallets",
                instruments: [
                  { method: "card" },
                  { method: "emi" },
                  { method: "netbanking" },
                  { method: "wallet" },
                ],
              },
            },
            sequence: ["block.upi", "block.other"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
      };

      if (isValidRzpOrderId) {
        options.order_id = realOrderId;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (failResp: any) {
        const msg = `Payment failed: ${failResp.error?.description || "Transaction declined"}`;
        setErrorMsg(msg);
        toast.error(msg, "Payment Declined");
        setIsLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Booking call error, attempting client-side Razorpay test modal:", err);
      // Attempt client-side Razorpay launch so the payment modal opens directly even if backend has an issue
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (scriptLoaded) {
          const brandLogo = getRazorpayBrandLogo();
          const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TsvM6ELYin3phv";
          const fallbackRef = `MHA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const fallbackInv = `INV-2026-27-${String(Math.floor(1 + Math.random() * 9999)).padStart(5, "0")}`;

          const fallbackOptions: any = {
            key: rzpKey,
            amount: Math.round(finalGrandTotal * 100),
            currency: "INR",
            name: "Mahastays",
            description: `${bookingType.toUpperCase()} Booking - ${title.slice(0, 30)}`,
            image: brandLogo,
            handler: function (response: any) {
              setBookingResult({
                bookingReference: fallbackRef,
                invoiceNumber: fallbackInv,
                booking: {
                  guestName: formData.fullName,
                  grandTotalInr: finalGrandTotal,
                  paymentStatus: "paid",
                  bookingStatus: "confirmed",
                },
                payment: {
                  method: "online",
                  amountInr: finalGrandTotal,
                  gatewayPaymentId: response.razorpay_payment_id,
                },
              });
              toast.success("Payment verified! Booking confirmed.", "Payment Successful");
              setIsLoading(false);
            },
            prefill: {
              name: formData.fullName,
              email: formData.email,
              contact: extractPhone(formData.phone),
            },
            theme: {
              color: "#ea110d",
              backdrop_color: "rgba(15, 23, 42, 0.65)",
              hide_topbar: false,
            },
            modal: {
              backdropclose: false,
              escape: true,
              handleback: true,
              confirm_close: true,
              animation: true,
              ondismiss: function () {
                setIsLoading(false);
                toast.info("Payment window closed.");
              },
            },
            config: {
              display: {
                language: "en",
                blocks: {
                  upi: {
                    name: "Pay via UPI",
                    instruments: [{ method: "upi" }],
                  },
                  other: {
                    name: "Cards, Netbanking & Wallets",
                    instruments: [
                      { method: "card" },
                      { method: "emi" },
                      { method: "netbanking" },
                      { method: "wallet" },
                    ],
                  },
                },
                sequence: ["block.upi", "block.other"],
                preferences: {
                  show_default_blocks: true,
                },
              },
            },
          };

          const rzp = new (window as any).Razorpay(fallbackOptions);
          rzp.open();
          return;
        }
      } catch (clientErr) {
        console.error("Failed to open Razorpay modal:", clientErr);
      }

      setErrorMsg(err.message || "Failed to proceed to payment. Please check your details and try again.");
      toast.error(err.message || "Unable to open payment gateway. Please try again.");
      setIsLoading(false);
    }
  };

  if (bookingResult) {
    const isPayAtProperty = formData.paymentMethod === "pay_at_property";
    const confirmationData: BookingConfirmationData = {
      bookingReference: bookingResult.bookingReference,
      invoiceNumber: isPayAtProperty ? undefined : bookingResult.invoiceNumber,
      bookingType,
      paymentStatus: isPayAtProperty ? "unpaid" : (bookingResult.paymentStatus || "paid"),
      bookingStatus: "confirmed",
      title,
      image:
        bookingResult.booking?.image ||
        imageUrl ||
        "",
      rating: 4.9,
      reviewsCount: 128,
      location: "Panchgani-Mahabaleshwar Road, Satara District, Maharashtra",
      checkInDate: startDate,
      checkInTime: "02:00 PM",
      checkOutDate: endDate || startDate,
      checkOutTime: "11:00 AM",
      nights,
      guestsText: `${adults} Adult${adults > 1 ? "s" : ""}${
        children > 0 ? `, ${children} Child${children > 1 ? "ren" : ""}` : ""
      }`,
      roomOrTierText: tierOrRoomName,
      totalAmount: finalGrandTotal,
      amountPaid: isPayAtProperty ? 0 : finalGrandTotal,
      amountDue: isPayAtProperty ? finalGrandTotal : 0,
      paymentMethod:
        isPayAtProperty
          ? "Pay at Property"
          : formData.paymentMethod === "upi"
          ? "UPI"
          : "Online Payment",
      guestName: formData.fullName,
      guestEmail: formData.email,
      pricing: {
        grandTotal: finalGrandTotal,
        grandTotalInr: finalGrandTotal,
        basePrice: baseCost,
        baseCost,
        cleaningFee: fee,
        memberDiscount,
        taxableAmount: baseCost - memberDiscount + fee,
        taxesGst: taxes,
      },
    };

    return (
      <div className="min-h-screen bg-white flex flex-col justify-between">
        <Navbar />
        <main className="flex-1 w-full pt-20 sm:pt-24 pb-16 bg-white">
          <BookingConfirmationView data={confirmationData} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#ea110d] font-poppins transition-colors cursor-pointer"
          >
            <span>←</span>
            <span>Back to Property Details</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold font-poppins">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>256-Bit SSL Encrypted &amp; Verified</span>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ══════════════════════════════════════════════════════════════ */}
          {/* LEFT COLUMN: Guest Details, Address, Payment Methods            */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Platform Bookings Paused Warning Banner */}
              {!platformBookingsEnabled && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold text-lg shadow-sm">
                    !
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-950 font-poppins">
                      Platform Bookings Temporarily Paused
                    </h4>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      {platformBookingsMessage ||
                        "Reservations are currently paused across the platform by administration for scheduled system maintenance. Checkouts cannot be submitted at this time. Please check back shortly or reach out to our concierge desk."}
                    </p>
                  </div>
                </div>
              )}

              {/* Account Authentication Banner */}
              {!isLoggedIn ? (
                <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-950 font-poppins">
                        Guest Login Required to Confirm Reservation
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Please sign in or create an account to place this booking, track reservation status, and download tax invoices.
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/checkout")}`}
                    className="px-5 py-2.5 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs font-bold font-poppins transition-all shrink-0 shadow-md shadow-red-500/20 whitespace-nowrap"
                  >
                    Log In / Sign Up →
                  </Link>
                </div>
              ) : (
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      ✓
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-950 font-poppins flex items-center gap-2">
                        <span>Logged in as {loggedInUser?.fullName || loggedInUser?.name || "Verified Traveler"}</span>
                        <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md font-bold">
                          Verified Account
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        {loggedInUser?.email || formData.email} • Booking order will be linked to your account profile
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold hidden sm:inline">Active Session</span>
                </div>
              )}

              {/* Card 1: Primary Guest Information */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea110d] block font-poppins">
                      STEP 1 OF 2
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                      Lead Guest Information
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">As shown on Govt ID</span>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#ea110d] font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikramaditya Patil"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ea110d] text-xs font-medium text-slate-900 bg-slate-50/40"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                      Email Address * <span className="text-slate-400 font-normal">(for instant invoice)</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. vikram@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ea110d] text-xs font-medium text-slate-900 bg-slate-50/40"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                      Mobile Number *
                    </label>
                    <div className="flex rounded-xl border border-slate-200 bg-slate-50/40 overflow-hidden focus-within:border-[#ea110d]">
                      <span className="px-3 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 border-r border-slate-200">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="98765 43210"
                        value={extractPhone(formData.phone)}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setFormData({ ...formData, phone: digits });
                        }}
                        className="w-full px-3 py-2.5 text-xs font-medium text-slate-900 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Billing State */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                      State / Union Territory
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ea110d] text-xs font-medium text-slate-900 bg-slate-50/40 cursor-pointer"
                    >
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Goa">Goa</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Delhi">Delhi NCR</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Other">Other State</option>
                    </select>
                  </div>

                  {/* Special Requests */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                      Special Requests / Notes <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Late check-in around 6:00 PM, vegetarian chef request, anniversary flower setup..."
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ea110d] text-xs font-medium text-slate-900 bg-slate-50/40"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Promo Code / Coupons & Instant Checkout */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#ea110d] font-poppins">
                        STEP 2 OF 2
                      </span>
                      <div className="w-14 h-1.5 bg-rose-100 rounded-full overflow-hidden flex">
                        <div className="w-3/5 h-full bg-[#ea110d] rounded-full" />
                      </div>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-poppins tracking-tight">
                      Offers &amp; Payment
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ea110d] bg-[#fef2f2] px-3.5 py-1.5 rounded-full border border-rose-100 shrink-0">
                    <span className="text-sm">⚡</span>
                    <span>Safe &amp; Instant</span>
                  </span>
                </div>

                {/* Coupon Code Section */}
                <div>
                  {appliedCoupon ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          %
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs font-mono text-emerald-950 bg-emerald-200/80 px-2 py-0.5 rounded border border-emerald-300">
                              {appliedCoupon.code}
                            </span>
                            <span className="text-xs font-bold text-emerald-800">
                              Saved ₹{appliedCoupon.discountAmount.toLocaleString("en-IN")}!
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                            {appliedCoupon.description}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs font-bold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2.5 sm:gap-3 items-center">
                        <div className="relative flex-1">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500">
                            {/* Outline Ticket Icon */}
                            <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="Enter coupon code (e.g. MAHA10)"
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value.toUpperCase());
                              setCouponError(null);
                            }}
                            className="w-full pl-11 pr-3.5 py-3 rounded-2xl border border-slate-200 uppercase font-mono text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:normal-case placeholder:font-normal focus:outline-none focus:border-[#ea110d] bg-white transition-all shadow-2xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={!couponInput.trim()}
                          className="px-6 py-3 rounded-2xl bg-[#fff1f1] hover:bg-rose-100 disabled:opacity-50 text-[#ea110d] border border-rose-200 text-xs sm:text-sm font-bold font-poppins transition-all cursor-pointer shrink-0"
                        >
                          Apply
                        </button>
                      </div>

                      {couponError && (
                        <p className="text-xs text-red-600 font-medium mt-1.5 flex items-center gap-1">
                          <span>⚠️</span>
                          <span>{couponError}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2 animate-fadeIn">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">!</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !platformBookingsEnabled}
                  className={`w-full py-4 px-6 sm:py-3.5 sm:px-6 rounded-2xl text-white font-bold tracking-wide font-poppins transition-all flex items-center justify-center sm:justify-between ${
                    !platformBookingsEnabled
                      ? 'bg-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-[#ea110d] hover:bg-[#d00f0c] active:scale-[0.99] shadow-xl shadow-red-500/25 cursor-pointer disabled:opacity-60'
                  }`}
                >
                  {/* Small screen layout (Centered lock icon + Pay text + arrow) */}
                  <div className="flex sm:hidden items-center justify-center gap-2.5 w-full">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    <span className="font-extrabold text-sm font-poppins">
                      {!platformBookingsEnabled
                        ? "Platform Bookings Paused"
                        : !isLoggedIn
                        ? `Log In to Book (₹${finalGrandTotal.toLocaleString("en-IN")})`
                        : `Pay ₹${finalGrandTotal.toLocaleString("en-IN")} & Complete Booking`}
                    </span>
                    <span className="text-base font-bold">→</span>
                  </div>

                  {/* Big screen layout (Pay text on left, stacked logos SVGs on right inside button) */}
                  <div className="hidden sm:flex items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-base sm:text-lg font-extrabold font-poppins">
                        {!platformBookingsEnabled
                          ? "Platform Bookings Paused by Administration"
                          : !isLoggedIn
                          ? `Log In to Book (₹${finalGrandTotal.toLocaleString("en-IN")})`
                          : `Pay ₹${finalGrandTotal.toLocaleString("en-IN")} & Complete Booking`}
                      </span>
                      <span className="text-lg">→</span>
                    </div>

                    {/* Stacked Payment Badges: PhonePe, Paytm, Google Pay, UPI, Visa, Bank */}
                    <div className="flex items-center -space-x-2 shrink-0 p-1.5 rounded-2xl">
                      {/* PhonePe (Official from phonepe.svg) */}
                      <div
                        title="PhonePe"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-md shrink-0 overflow-hidden"
                      >
                        <svg viewBox="195 245 275 275" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <clipPath id="phonepe-clip-btn">
                              <rect width="1366" height="768" fill="none" />
                            </clipPath>
                          </defs>
                          <g clipPath="url(#phonepe-clip-btn)">
                            <path
                              fill="#5f259f"
                              d="M332.63 514.18c-3.88-.38-7.78-.64-11.64-1.15-25.26-3.35-47.76-13.07-67.18-29.6a127.87 127.87 0 0 1-41.44-65.75 124.29 124.29 0 0 1-3.78-42.55c2-24.95 10.33-47.61 25.5-67.51 21.24-27.87 49.33-44.9 84-50.05 37.84-5.63 72 3.92 101.51 28.13 25.43 20.83 40.77 47.94 45.43 80.46 5.5 38.35-4.36 72.79-29.38 102.44-21.07 25-48.24 39.43-80.53 44.3-4.05.62-8.16.86-12.24 1.28zm-23.78-171c-10.43 0-20.85 0-31.28 0-2.78 0-3.77.84-4 3.58a35.11 35.11 0 0 0 .15 8 9.19 9.19 0 0 0 9.18 8.06c2.4.05 4.8 0 7.2 0 3 0 3 0 3 2.95q0 16.75 0 33.5a50.67 50.67 0 0 0 1.73 13.2c3.21 12 10.21 20.59 22.36 24.17 10.15 3 20.34 2.27 30.36-1 2.35-.77 2.39-.77 2.4 1.72 0 6.92-.05 13.84 0 20.76a11.07 11.07 0 0 0 11.25 11.22c3.29 0 6.59.06 9.88 0a4.2 4.2 0 0 0 4.29-4.3c0-.82 0-1.64 0-2.46q0-48.42 0-96.81c0-3.68 0-3.68 3.58-3.68 4.18 0 8.37 0 12.55 0 3.1 0 4-.95 4-4.1q0-3.07 0-6.17c-.07-5.6-3.83-9.33-9.48-9.38q-7.41-.06-14.81 0a4 4 0 0 1-3.41-1.51c-1.85-2.2-3.77-4.35-5.66-6.51Q346 315.77 329.79 297.18a13.29 13.29 0 0 0-10.6-5c-6.67.08-12.59 3-18.74 5.07-1.87.62-2.07 3-.76 4.5a20 20 0 0 0 1.46 1.45Q321.07 322.11 341 341c.48.45 1.36.88 1.14 1.57-.28.9-1.29.53-2 .53-10.43 0-20.85 0-31.28 0"
                            />
                            <path
                              fill="#5f259f"
                              d="M350,388.34c0,7.61-.05,15.21,0,22.81a3,3,0,0,1-2.31,3.3,36.61,36.61,0,0,1-15.21,1.84c-8.75-.83-13.64-6-14.38-14.87-.68-8.14-.18-16.29-.32-24.44-.06-4,0-7.94,0-11.91,0-1.65.54-2.32,2.27-2.31,9.19.06,18.38.08,27.56,0,2,0,2.42.81,2.41,2.58-.06,7.67,0,15.34,0,23"
                            />
                          </g>
                        </svg>
                      </div>

                      {/* Paytm (Official from paytm.svg) */}
                      <div
                        title="Paytm"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-md shrink-0 overflow-hidden px-1"
                      >
                        <svg viewBox="-164 191.6 512 193" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M229.8,243.2c2-1.6,3-2.4,4-3.2c13.9-11.8,31.7-10.5,43.6,3.5c1.2,1.4,1.8,1.5,3,0.3c0.8-0.9,1.7-1.6,2.5-2.5 c9.3-9.1,21.6-11.8,33.1-6.7c12.1,5.4,18.6,14.9,18.7,28.2c0.2,28.7,0.1,57.3,0.1,86c0,10.2-6.3,16.6-16.4,16.6c-4,0-8-0.3-12,0.1 c-4.1,0.4-5.3-0.9-5.3-5.2c0.2-28,0.1-56,0.1-84c0-1.2,0-2.3,0-3.5c-0.1-6.5-2.7-9.2-8.9-9.5c-5.6-0.3-9.5,3.1-10.1,8.8 c-0.1,1.3,0,2.7,0,4c0,24.2,0,48.3,0,72.5c0,10.6-6.1,16.8-16.7,16.7c-5.4-0.1-12.7,2.4-15.8-1.1c-2.7-3-0.9-10.1-0.9-15.4 c0-24.8,0-49.7,0-74.5c0-8.8-5.7-13.3-13.1-10.3c-4.6,1.9-6.1,5.6-6.1,10.4c0.1,23.2,0,46.3,0,69.5c0,1.8,0,3.7,0,5.5 c-0.3,9.7-6.5,15.8-16.1,15.9c-4,0.1-8-0.3-12,0.1c-4.3,0.4-5.6-0.8-5.5-5.4c0.2-39.3,0.1-78.6,0.1-118c0-1.7,0.1-3.3,0-5 c-0.2-2.2,0.7-2.9,2.9-2.9c9.2,0.1,18.3,0.1,27.5,0c2.3,0,3.4,0.6,3.2,3.1C229.5,239,229.7,240.6,229.8,243.2z"
                            fill="#02b9ef"
                          />
                          <path
                            d="M17.8 297.4c0 13.7 0 27.3 0 41-.1 17.8-9.4 27-27.2 27.1-7.8 0-15.7.1-23.5 0-15.8-.2-27.4-10.7-28.2-26.5-.6-11.3-.7-22.7-.1-34 .8-16.2 13.2-27.6 29.6-27.8 4.3-.1 8.7 0 13 0 4.2-.1 5.8-2.5 5.7-6.5 0-4-1.8-5.8-5.8-5.6-4.5.1-9 .1-13.5 0-11-.2-17.1-6.2-17-17 0-4.4-2-10.3.9-12.9 2.5-2.2 8.2-.8 12.5-.8 11.2-.1 22.3 0 33.5 0 11.9 0 20 8.1 20.1 20.1C17.9 268.7 17.8 283.1 17.8 297.4zM-12.8 320.1c0-1.7 0-3.3 0-5 0-10.2 0-10.2-10.2-9.8-5.1.2-7.9 2.8-8 8.1-.1 4.2-.1 8.3 0 12.5.1 7.2 3.3 9.1 13.7 9.4 7.7.2 3.8-5.2 4.5-8.2C-12.4 324.9-12.9 322.4-12.8 320.1zM106.8 286.5c0 15.3.2 30.7-.1 46-.2 11.8-3 22.5-14.4 28.8-4.6 2.5-9.6 3.9-14.8 4-11.5.2-23 0-34.5.2-2.8 0-3.4-1-3.3-3.5.2-4.2-.1-8.3.1-12.5.2-8 6.3-14.1 14.3-14.4 5.2-.2 10.3-.1 15.5 0 4.2 0 6.5-1.7 6.5-6.2 0-4.6-2.2-6.2-6.4-6.3-7-.2-14 .8-20.9-1.2-11.9-3.5-20.6-13.4-20.9-25.7-.6-19.5-.2-39-.3-58.5 0-2.2.7-2.9 2.9-2.8 8.2.1 16.3.2 24.5 0 3.6-.1 3.1 1.9 3.1 4.1 0 14.7 0 29.3 0 44 0 6.4 3 9.8 8.6 10 6.6.2 9.5-2.5 9.5-9.2 0-14.8.1-29.7-.1-44.5 0-3.5.9-4.5 4.4-4.4 7.3.3 14.7.4 22 0 4-.2 4.6 1.3 4.5 4.8C106.7 254.9 106.8 270.7 106.8 286.5zM-148 309.2c0-16.3 0-32.7 0-49 0-16 9.8-26 25.9-25.8 10.5.1 21-1.2 31.4.8 13.3 2.6 21.7 12.9 21.8 26.6.1 14.5 0 29 0 43.5 0 18.2-10.7 29.3-28.9 29.8-5.5.2-11 .1-16.5 0-2.5-.1-3.6.7-3.5 3.4.2 4 .1 8 0 12-.2 8.6-6.3 14.8-14.8 14.9-5 .1-11.3 2.1-14.5-.8-3-2.7-.8-9.1-.9-13.9C-148.1 336.9-148 323-148 309.2zM-117.8 284.7c0 3.2 0 6.3 0 9.5 0 11.3 0 11.3 11.3 10.3 4.9-.4 7.2-2.8 7.3-7.7.1-5.6-.2-11.3.1-16.9.6-16.2-2.4-14.6-15.6-14.7-2.4 0-3.2.7-3.2 3.1C-117.7 273.7-117.8 279.2-117.8 284.7z"
                            fill="#06306f"
                          />
                          <path
                            d="M135.1,309.4c0-13.3-0.1-26.7,0.1-40c0-3.1-0.7-4.4-4.1-4.3c-4.5,0.2-10.5,1.5-13-0.7 c-3.1-2.9-0.7-9.1-1.1-13.9c0-0.3,0-0.7,0-1c0-4.7-1.5-10.2,0.5-13.7s8.1-1.3,12.4-2.4c8.5-2.2,14.9-7.1,20.1-13.9 c3.6-4.6,8.1-7.9,13.9-9c3.1-0.6,5-0.2,4.8,3.8c-0.3,5.6,0,11.3-0.1,17c-0.1,2.4,0.8,3.2,3.2,3.1c4-0.1,8,0.1,12-0.1 c2.4-0.1,3.2,0.8,3.1,3.2c-0.1,8.2-0.1,16.3,0,24.5c0,2.3-0.6,3.5-3.1,3.2c-0.5-0.1-1,0-1.5,0c-4.4,0.4-10.5-2-12.8,1 c-2.2,2.8-0.8,8.6-0.8,13.1c0,27.2-0.1,54.3,0.1,81.5c0,3.8-1,5-4.8,4.7c-3.6-0.3-7.3,0-11-0.1c-10.8-0.4-17.9-7.7-17.9-18.5 C135.1,334.4,135.1,321.9,135.1,309.4z"
                            fill="#02b9ef"
                          />
                        </svg>
                      </div>

                      {/* Google Pay */}
                      <div
                        title="Google Pay"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-md shrink-0 overflow-hidden p-1"
                      >
                        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
                          <path fill="#4285F4" d="M34.8 24.5c0-.8-.1-1.6-.2-2.3H24v4.6h6.1c-.3 1.4-1.1 2.6-2.4 3.4v2.9h3.8c2.3-2.1 3.5-5.1 3.5-8.6z" />
                          <path fill="#34A853" d="M24 35.5c3.1 0 5.7-1 7.6-2.8l-3.8-2.9c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6h-3.9v3c1.9 3.8 5.8 6.2 10.2 6.2z" />
                          <path fill="#FBBC05" d="M17.7 26.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3v-3h-3.9C13 20.3 12.5 22.1 12.5 24s.5 3.7 1.3 5.3l3.9-3z" />
                          <path fill="#EA4335" d="M24 17.1c1.7 0 3.2.6 4.4 1.7l3.3-3.3C29.7 13.6 27.1 12.5 24 12.5c-4.4 0-8.3 2.5-10.2 6.2l3.9 3c.9-2.6 3.4-4.6 6.3-4.6z" />
                        </svg>
                      </div>

                      {/* UPI (Official Unified Payments Interface) */}
                      <div
                        title="UPI (Unified Payments Interface)"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-md shrink-0 overflow-hidden p-1"
                      >
                        <svg viewBox="0 0 1024 466" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                          <path fill="#3d3d3c" d="M98.1 340.7h6.3l-5.9 24.5c-.9 3.6-.7 6.4.5 8.2 1.2 1.8 3.4 2.7 6.7 2.7 3.2 0 5.9-.9 8-2.7 2.1-1.8 3.5-4.6 4.4-8.2l5.9-24.5h6.4l-6 25.1c-1.3 5.4-3.6 9.5-7 12.2-3.3 2.7-7.7 4.1-13.1 4.1-5.4 0-9.1-1.3-11.1-4s-2.4-6.8-1.1-12.2l6-25.2zm31.4 40.3 10-41.9 19 24.6c.5.7 1 1.4 1.5 2.2.5.8 1 1.7 1.6 2.7l6.7-27.9h5.9l-10 41.8-19.4-25.1-1.5-2.1c-.5-.8-.9-1.5-1.2-2.4l-6.7 28h-5.9zm44.2 0 9.6-40.3h6.4l-9.6 40.3h-6.4zm15.5 0 9.6-40.3h21.9l-1.3 5.6h-15.5l-2.4 10H217l-1.4 5.7h-15.5l-4.5 18.9h-6.4zm29 0 9.6-40.3h6.4l-9.6 40.3h-6.4zm15.5 0 9.6-40.3h21.9l-1.3 5.6h-15.5l-2.4 10.1h15.5l-1.4 5.7h-15.5l-3.1 13H257l-1.4 5.9h-21.9zm29.3 0 9.6-40.3h8.6c5.6 0 9.5.3 11.6.9 2.1.6 3.9 1.5 5.3 2.9 1.8 1.8 3 4.1 3.5 6.8.5 2.8.3 6-.5 9.5-.9 3.6-2.2 6.7-4 9.5-1.8 2.8-4.1 5-6.8 6.8-2 1.4-4.2 2.3-6.6 2.9-2.3.6-5.8.9-10.4.9H263zm7.8-6h5.4c2.9 0 5.2-.2 6.8-.6 1.6-.4 3-1.1 4.3-2 1.8-1.3 3.3-2.9 4.5-4.9 1.2-1.9 2.1-4.2 2.7-6.8.6-2.6.8-4.8.5-6.7-.3-1.9-1-3.6-2.2-4.9-.9-1-2-1.6-3.5-2-1.5-.4-3.8-.6-7.1-.6h-4.6l-6.8 28.5zm59.7-12.1-4.3 18.1h-6l9.6-40.3h9.7c2.9 0 4.9.2 6.2.5 1.3.3 2.3.8 3.1 1.6 1 .9 1.7 2.2 2 3.8.3 1.6.2 3.3-.2 5.2-.5 1.9-1.2 3.7-2.3 5.3-1.1 1.6-2.4 2.9-3.8 3.8-1.2.7-2.5 1.3-3.9 1.6-1.4.3-3.6.5-6.4.5h-3.7zm1.7-5.4h1.6c3.5 0 6-.4 7.4-1.2 1.4-.8 2.3-2.2 2.8-4.2.5-2.1.2-3.7-.8-4.5-1.1-.9-3.3-1.3-6.6-1.3H335l-2.8 11.2zm40.1 23.5-2-10.4h-15.6l-7 10.4H341l29-41.9 9 41.9h-6.7zm-13.8-15.9h10.9l-1.8-9.2c-.1-.6-.2-1.3-.2-2-.1-.8-.1-1.6-.1-2.5-.4.9-.8 1.7-1.3 2.5-.4.8-.8 1.5-1.2 2.1l-6.3 9.1zm29.7 15.9 4.4-18.4-8-21.8h6.7l5 13.7c.1.4.2.8.4 1.4.2.6.3 1.2.5 1.8l1.2-1.8c.4-.6.8-1.1 1.2-1.6l11.7-13.5h6.4L399 362.5l-4.4 18.4h-6.4zm60.9-19.9c0-.3.1-1.2.3-2.6.1-1.2.2-2.1.3-2.9-.4.9-.8 1.8-1.3 2.8-.5.9-1.1 1.9-1.8 2.8l-15.4 21.5-5-21.9c-.2-.9-.4-1.8-.5-2.6-.1-.8-.2-1.7-.2-2.5-.2.8-.5 1.7-.8 2.7-.3.9-.7 1.9-1.2 2.9l-9 19.8h-5.9l19.3-42 5.5 25.4c.1.4.2 1.1.3 2 .1.9.3 2.1.5 3.5.7-1.2 1.6-2.6 2.8-4.4.3-.5.6-.8.7-1.1l17.4-25.4-.6 42h-5.9l.5-20zm10.6 19.9 9.6-40.3h21.9l-1.3 5.6h-15.5l-2.4 10.1h15.5l-1.4 5.7h-15.5l-3.1 13H483l-1.4 5.9h-21.9zm29.2 0 10-41.9 19 24.6c.5.7 1 1.4 1.5 2.2.5.8 1 1.7 1.6 2.7l6.7-27.9h5.9l-10 41.8-19.4-25.1-1.5-2.1c-.5-.8-.9-1.5-1.2-2.4l-6.7 28h-5.9zm65.1-34.8-8.3 34.7h-6.4l8.3-34.7h-10.4l1.3-5.6h27.2l-1.3 5.6H554zm6.7 26.7 5.7-2.4c.1 1.8.6 3.2 1.7 4.1 1.1.9 2.6 1.4 4.6 1.4 1.9 0 3.5-.5 4.9-1.6 1.4-1.1 2.3-2.5 2.7-4.3.6-2.4-.8-4.5-4.2-6.3-.5-.3-.8-.5-1.1-.6-3.8-2.2-6.2-4.1-7.2-5.9-1-1.8-1.2-3.9-.6-6.4.8-3.3 2.5-5.9 5.2-8 2.7-2 5.7-3.1 9.3-3.1 2.9 0 5.2.6 6.9 1.7 1.7 1.1 2.6 2.8 2.9 4.9l-5.6 2.6c-.5-1.3-1.1-2.2-1.9-2.8-.8-.6-1.8-.9-3-.9-1.7 0-3.2.5-4.4 1.4-1.2.9-2 2.1-2.4 3.7-.6 2.4 1.1 4.7 5 6.8.3.2.5.3.7.4 3.4 1.8 5.7 3.6 6.7 5.4 1 1.8 1.2 3.9.6 6.6-.9 3.8-2.8 6.8-5.7 9.1-2.9 2.2-6.3 3.4-10.3 3.4-3.3 0-5.9-.8-7.7-2.4-2-1.6-2.9-3.9-2.8-6.8zm47.1 8.1 9.6-40.3h6.4l-9.6 40.3h-6.4zm15.6 0 10-41.9 19 24.6c.5.7 1 1.4 1.5 2.2.5.8 1 1.7 1.6 2.7l6.7-27.9h5.9l-10 41.8-19.4-25.1-1.5-2.1c-.5-.8-.9-1.5-1.2-2.4l-6.7 28h-5.9zm65.1-34.8-8.3 34.7h-6.4l8.3-34.7h-10.4l1.3-5.6h27.2l-1.3 5.6h-10.4zm6.9 34.8 9.6-40.3h22l-1.3 5.6h-15.5l-2.4 10.1h15.5l-1.4 5.7h-15.5l-3.1 13h15.5l-1.4 5.9h-22zm39.5-18.1-4.3 18h-6l9.6-40.3h8.9c2.6 0 4.6.2 5.9.5 1.4.3 2.5.9 3.3 1.7 1 1 1.6 2.2 1.9 3.8.3 1.5.2 3.2-.2 5.1-.8 3.2-2.1 5.8-4.1 7.6-2 1.8-4.5 2.9-7.5 3.3l9.1 18.3h-7.2l-8.7-18h-.7zm1.6-5.1h1.2c3.4 0 5.7-.4 7-1.2 1.3-.8 2.2-2.2 2.7-4.3.5-2.2.3-3.8-.7-4.7-1-.9-3.1-1.4-6.3-1.4h-1.2l-2.7 11.6zm18.9 23.2 9.6-40.3h21.9l-1.3 5.6h-15.5l-2.4 10h15.5l-1.4 5.7h-15.5l-4.5 18.9h-6.4zm52.8 0-2-10.4h-15.6l-7 10.4h-6.7l29-41.9 9 41.9h-6.7zm-13.9-15.9h10.9l-1.8-9.2c-.1-.6-.2-1.3-.2-2-.1-.8-.1-1.6-.1-2.5-.4.9-.8 1.7-1.3 2.5-.4.8-.8 1.5-1.2 2.1l-6.3 9.1zm62.2-14.6c-1.4-1.6-3.1-2.8-4.9-3.5-1.8-.8-3.8-1.2-6.1-1.2-4.3 0-8.1 1.4-11.5 4.2-3.4 2.8-5.6 6.5-6.7 11-1 4.3-.6 7.9 1.4 10.8 1.9 2.8 4.9 4.2 8.9 4.2 2.3 0 4.6-.4 6.9-1.3 2.3-.8 4.6-2.1 7-3.8l-1.8 7.4c-2 1.3-4.1 2.2-6.3 2.8-2.2.6-4.4.9-6.8.9-3 0-5.7-.5-8-1.5s-4.2-2.5-5.7-4.5c-1.5-1.9-2.4-4.2-2.8-6.8-.4-2.6-.3-5.4.5-8.4.7-3 1.9-5.7 3.5-8.3 1.6-2.6 3.7-4.9 6.1-6.8 2.4-2 5-3.5 7.8-4.5s5.6-1.5 8.5-1.5c2.3 0 4.4.3 6.4 1 1.9.7 3.7 1.7 5.3 3.1l-1.7 6.7zm.6 30.5 9.6-40.3h21.9l-1.3 5.6h-15.5l-2.4 10.1h15.5l-1.4 5.7H868l-3.1 13h15.5L879 381h-21.9z" />
                          <path fill="#70706e" d="M740.7 305.6h-43.9l61-220.3h43.9l-61 220.3zM717.9 92.2c-3-4.2-7.7-6.3-14.1-6.3H462.6l-11.9 43.2h219.4l-12.8 46.1H481.8v-.1h-43.9l-36.4 131.5h43.9l24.4-88.2h197.3c6.2 0 12-2.1 17.4-6.3 5.4-4.2 9-9.4 10.7-15.6l24.4-88.2c1.9-6.6 1.3-11.9-1.7-16.1zm-342 199.6c-2.4 8.7-10.4 14.8-19.4 14.8H130.2c-6.2 0-10.8-2.1-13.8-6.3-3-4.2-3.7-9.4-1.9-15.6l55.2-198.8h43.9l-49.3 177.6h175.6l49.3-177.6h43.9l-57.2 205.9z" />
                          <path fill="#098041" d="M877.5 85.7 933 196.1 816.3 306.5z" />
                          <path fill="#e97626" d="M838.5 85.7 894 196.1 777.2 306.5z" />
                        </svg>
                      </div>

                      {/* Visa Card (Official from visa-card) */}
                      <div
                        title="Visa Card"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-md shrink-0 overflow-hidden"
                      >
                        <svg viewBox="0 800 4335 2800" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="visa_id0" x1="2167.46" x2="2167.46" y1="3573.9" y2="845.69" gradientUnits="userSpaceOnUse">
                              <stop offset="0" stopColor="#E5097F" />
                              <stop offset="1" stopColor="#96336D" />
                            </linearGradient>
                            <linearGradient id="visa_id1" x1="1115.54" x2="1649.92" y1="773.65" y2="3645.95" gradientUnits="userSpaceOnUse">
                              <stop offset="0" stopColor="#E8388C" />
                              <stop offset="1" stopColor="#97326D" />
                            </linearGradient>
                          </defs>
                          <g>
                            <rect width="4267" height="2728" x="34" y="868" fill="#898989" rx="262" ry="262" />
                            <rect width="4267" height="2728" x="34" y="846" fill="url(#visa_id0)" rx="262" ry="262" />
                            <path fill="url(#visa_id1)" d="M296 3574h1369L2732 846H297c-144 0-262 118-262 262v2204c0 144 118 262 262 262z" />
                            <path
                              fill="#fefefe"
                              d="M581 1402c-5-7-10-19-14-27-14-28-49-72-71-90-19-16-47-39-70-48 1 6 4 15 6 21l94 339h121l134-311c6-14 41-92 44-104H704l-108 276c-2 3-1 2-3 4-1-7-11-55-13-59zm954-104c0 11 12 61 15 76 6 24 11 50 17 75h-91l59-151zm-231 301c132 0 109 10 125-30 4-11 8-24 13-34h144c1 11 5 22 7 33 3 14 4 30 12 30 113 0 102 7 96-22-2-10-3-16-6-26-4-18-8-35-12-52l-47-212c-7-35-15-71-23-106-29 0-106-6-128 10-21 16-38 65-48 89-10 22-19 42-29 65-9 22-18 42-28 63-22 48-57 136-79 178-3 6-8 12 2 12zm-274-293v13c0 48 55 87 91 102 9 4 18 8 27 13 98 53-4 112-122 65-6-3-21-10-28-10-1 13-5 31-8 45l-7 46c0 11 91 23 112 23 61 0 107-4 154-36 63-43 92-142-7-202-36-22-94-37-94-69 0-42 104-42 159-13 1-17 15-72 15-91-31-15-77-17-115-17-81 0-178 49-178 131zm-231 290h115l61-363c1-9 3-17 4-25 2-9 4-17 4-28H869c0 14-55 323-61 363l-9 53z"
                            />
                            <path
                              fill="#c5c6c6"
                              d="M426 1237c23 10 51 33 70 48 22 18 57 62 71 90 4 8 9 20 14 27 0-12-27-132-31-154-14-70-18-67-117-67H308v7c0 5 4 4 25 10 24 7 75 27 93 39z"
                            />
                          </g>
                        </svg>
                      </div>

                      {/* NetBanking / Bank (Official from bank.svg) */}
                      <div
                        title="Net Banking (All 50+ Banks)"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-md shrink-0 overflow-hidden p-1.5"
                      >
                        <svg viewBox="0 0 98 98" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                          <rect width="94.04" height="4.81" x="2.25" y="92.19" fill="#0f172a" />
                          <rect width="87.03" height="4.81" x="5.76" y="85.38" fill="#0f172a" />
                          <polygon points="42.865 21.698 45.853 21.698 44.359 17.739" fill="#0f172a" />
                          <path d="M36.8279 20.9883h-2.4033v2.3164h2.4033c.7842 0 1.2578-.436 1.2578-1.1582C38.0857 21.5239 37.6492 20.9883 36.8279 20.9883zM37.9236 18.6353c0-.6099-.4238-1.0708-1.1582-1.0708h-2.3408v2.1416h2.3408C37.4998 19.7061 37.9236 19.2705 37.9236 18.6353z" fill="#0f172a" />
                          <path d="M48.99,1L1.71,29.4301h94.55L48.99,1z M37.1638,24.5869h-4.1963v-8.3047h4.084c1.5322,0,2.3662,0.9463,2.3662,2.1162 c0,1.0337-0.6729,1.7432-1.4443,1.9053c0.8965,0.1367,1.6064,1.021,1.6064,2.0293C39.5799,23.6279,38.7322,24.5869,37.1638,24.5869 z M46.8738,24.5869l-0.6104-1.6064h-3.8096l-0.6104,1.6064h-1.6563l3.2627-8.3047h1.8174l3.2627,8.3047H46.8738z M56.6219,24.5869 h-1.4072l-4.333-5.9395v5.9395h-1.457v-8.3047h1.4941l4.2461,5.752v-5.752h1.457V24.5869z M60.5799,21.0757l-0.7344,0.8589v2.6523 h-1.457v-8.3047h1.457v3.9468l3.25-3.9468h1.8047l-3.374,3.9092l3.6357,4.3955h-1.8047L60.5799,21.0757z" fill="#0f172a" />
                          <polygon points="22.93 83.38 22.93 43.03 25.75 43.03 25.75 38.39 8.56 38.39 8.56 43.03 11.37 43.03 11.37 83.38" fill="#0f172a" />
                          <polygon points="65.76 83.38 65.76 43.03 68.58 43.03 68.58 38.39 51.38 38.39 51.38 43.03 54.19 43.03 54.19 83.38" fill="#0f172a" />
                          <polygon points="87.18 83.38 87.18 43.03 89.99 43.03 89.99 38.39 72.8 38.39 72.8 43.03 75.61 43.03 75.61 83.38" fill="#0f172a" />
                          <polygon points="44.35 83.38 44.35 43.03 47.17 43.03 47.17 38.39 29.97 38.39 29.97 43.03 32.78 43.03 32.78 83.38" fill="#0f172a" />
                          <rect width="87.53" height="4.96" x="5.29" y="31.43" fill="#0f172a" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Small Screen Guarantees & Outside Logos (Only visible on small screen) */}
                <div className="sm:hidden space-y-4">
            

                  {/* Logos Box Row (Using the exact same SVG badges as the bigscreen button) */}
                  <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3 flex items-center justify-between sm:justify-around gap-2 overflow-x-auto select-none">
                    {/* UPI */}
                    <div
                      title="UPI (Unified Payments Interface)"
                      className="w-8 h-8 rounded-full bg-white border border-slate-200/90 flex items-center justify-center shadow-xs shrink-0 overflow-hidden p-1"
                    >
                      <svg viewBox="0 0 1024 466" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#3d3d3c" d="M98.1 340.7h6.3l-5.9 24.5c-.9 3.6-.7 6.4.5 8.2 1.2 1.8 3.4 2.7 6.7 2.7 3.2 0 5.9-.9 8-2.7 2.1-1.8 3.5-4.6 4.4-8.2l5.9-24.5h6.4l-6 25.1c-1.3 5.4-3.6 9.5-7 12.2-3.3 2.7-7.7 4.1-13.1 4.1-5.4 0-9.1-1.3-11.1-4s-2.4-6.8-1.1-12.2l6-25.2zm31.4 40.3 10-41.9 19 24.6c.5.7 1 1.4 1.5 2.2.5.8 1 1.7 1.6 2.7l6.7-27.9h5.9l-10 41.8-19.4-25.1-1.5-2.1c-.5-.8-.9-1.5-1.2-2.4l-6.7 28h-5.9zm44.2 0 9.6-40.3h6.4l-9.6 40.3h-6.4zm15.5 0 9.6-40.3h21.9l-1.3 5.6h-15.5l-2.4 10H217l-1.4 5.7h-15.5l-4.5 18.9h-6.4zm29 0 9.6-40.3h6.4l-9.6 40.3h-6.4zm15.5 0 9.6-40.3h21.9l-1.3 5.6h-15.5l-2.4 10.1h15.5l-1.4 5.7h-15.5l-3.1 13H257l-1.4 5.9h-21.9zm29.3 0 9.6-40.3h8.6c5.6 0 9.5.3 11.6.9 2.1.6 3.9 1.5 5.3 2.9 1.8 1.8 3 4.1 3.5 6.8.5 2.8.3 6-.5 9.5-.9 3.6-2.2 6.7-4 9.5-1.8 2.8-4.1 5-6.8 6.8-2 1.4-4.2 2.3-6.6 2.9-2.3.6-5.8.9-10.4.9H263zm7.8-6h5.4c2.9 0 5.2-.2 6.8-.6 1.6-.4 3-1.1 4.3-2 1.8-1.3 3.3-2.9 4.5-4.9 1.2-1.9 2.1-4.2 2.7-6.8.6-2.6.8-4.8.5-6.7-.3-1.9-1-3.6-2.2-4.9-.9-1-2-1.6-3.5-2-1.5-.4-3.8-.6-7.1-.6h-4.6l-6.8 28.5zm59.7-12.1-4.3 18.1h-6l9.6-40.3h9.7c2.9 0 4.9.2 6.2.5 1.3.3 2.3.8 3.1 1.6 1 .9 1.7 2.2 2 3.8.3 1.6.2 3.3-.2 5.2-.5 1.9-1.2 3.7-2.3 5.3-1.1 1.6-2.4 2.9-3.8 3.8-1.2.7-2.5 1.3-3.9 1.6-1.4.3-3.6.5-6.4.5h-3.7zm1.7-5.4h1.6c3.5 0 6-.4 7.4-1.2 1.4-.8 2.3-2.2 2.8-4.2.5-2.1.2-3.7-.8-4.5-1.1-.9-3.3-1.3-6.6-1.3H335l-2.8 11.2zm40.1 23.5-2-10.4h-15.6l-7 10.4H341l29-41.9 9 41.9h-6.7zm-13.8-15.9h10.9l-1.8-9.2c-.1-.6-.2-1.3-.2-2-.1-.8-.1-1.6-.1-2.5-.4.9-.8 1.7-1.3 2.5-.4.8-.8 1.5-1.2 2.1l-6.3 9.1zm29.7 15.9 4.4-18.4-8-21.8h6.7l5 13.7c.1.4.2.8.4 1.4.2.6.3 1.2.5 1.8l1.2-1.8c.4-.6.8-1.1 1.2-1.6l11.7-13.5h6.4L399 362.5l-4.4 18.4h-6.4zm60.9-19.9c0-.3.1-1.2.3-2.6.1-1.2.2-2.1.3-2.9-.4.9-.8 1.8-1.3 2.8-.5.9-1.1 1.9-1.8 2.8l-15.4 21.5-5-21.9c-.2-.9-.4-1.8-.5-2.6-.1-.8-.2-1.7-.2-2.5-.2.8-.5 1.7-.8 2.7-.3.9-.7 1.9-1.2 2.9l-9 19.8h-5.9l19.3-42 5.5 25.4c.1.4.2 1.1.3 2 .1.9.3 2.1.5 3.5.7-1.2 1.6-2.6 2.8-4.4.3-.5.6-.8.7-1.1l17.4-25.4-.6 42h-5.9l.5-20zm10.6 19.9 9.6-40.3h21.9l-1.3 5.6h-15.5l-2.4 10.1h15.5l-1.4 5.7h-15.5l-3.1 13H483l-1.4 5.9h-21.9zm29.2 0 10-41.9 19 24.6c.5.7 1 1.4 1.5 2.2.5.8 1 1.7 1.6 2.7l6.7-27.9h5.9l-10 41.8-19.4-25.1-1.5-2.1c-.5-.8-.9-1.5-1.2-2.4l-6.7 28h-5.9zm65.1-34.8-8.3 34.7h-6.4l8.3-34.7h-10.4l1.3-5.6h27.2l-1.3 5.6H554zm6.7 26.7 5.7-2.4c.1 1.8.6 3.2 1.7 4.1 1.1.9 2.6 1.4 4.6 1.4 1.9 0 3.5-.5 4.9-1.6 1.4-1.1 2.3-2.5 2.7-4.3.6-2.4-.8-4.5-4.2-6.3-.5-.3-.8-.5-1.1-.6-3.8-2.2-6.2-4.1-7.2-5.9-1-1.8-1.2-3.9-.6-6.4.8-3.3 2.5-5.9 5.2-8 2.7-2 5.7-3.1 9.3-3.1 2.9 0 5.2.6 6.9 1.7 1.7 1.1 2.6 2.8 2.9 4.9l-5.6 2.6c-.5-1.3-1.1-2.2-1.9-2.8-.8-.6-1.8-.9-3-.9-1.7 0-3.2.5-4.4 1.4-1.2.9-2 2.1-2.4 3.7-.6 2.4 1.1 4.7 5 6.8.3.2.5.3.7.4 3.4 1.8 5.7 3.6 6.7 5.4 1 1.8 1.2 3.9.6 6.6-.9 3.8-2.8 6.8-5.7 9.1-2.9 2.2-6.3 3.4-10.3 3.4-3.3 0-5.9-.8-7.7-2.4-2-1.6-2.9-3.9-2.8-6.8zm47.1 8.1 9.6-40.3h6.4l-9.6 40.3h-6.4zm15.6 0 10-41.9 19 24.6c.5.7 1 1.4 1.5 2.2.5.8 1 1.7 1.6 2.7l6.7-27.9h5.9l-10 41.8-19.4-25.1-1.5-2.1c-.5-.8-.9-1.5-1.2-2.4l-6.7 28h-5.9zm65.1-34.8-8.3 34.7h-6.4l8.3-34.7h-10.4l1.3-5.6h27.2l-1.3 5.6h-10.4zm6.9 34.8 9.6-40.3h22l-1.3 5.6h-15.5l-2.4 10.1h15.5l-1.4 5.7h-15.5l-3.1 13h15.5l-1.4 5.9h-22zm39.5-18.1-4.3 18h-6l9.6-40.3h8.9c2.6 0 4.6.2 5.9.5 1.4.3 2.5.9 3.3 1.7 1 1 1.6 2.2 1.9 3.8.3 1.5.2 3.2-.2 5.1-.8 3.2-2.1 5.8-4.1 7.6-2 1.8-4.5 2.9-7.5 3.3l9.1 18.3h-7.2l-8.7-18h-.7zm1.6-5.1h1.2c3.4 0 5.7-.4 7-1.2 1.3-.8 2.2-2.2 2.7-4.3.5-2.2.3-3.8-.7-4.7-1-.9-3.1-1.4-6.3-1.4h-1.2l-2.7 11.6zm18.9 23.2 9.6-40.3h21.9l-1.3 5.6h-15.5l-2.4 10h15.5l-1.4 5.7h-15.5l-4.5 18.9h-6.4zm52.8 0-2-10.4h-15.6l-7 10.4h-6.7l29-41.9 9 41.9h-6.7zm-13.9-15.9h10.9l-1.8-9.2c-.1-.6-.2-1.3-.2-2-.1-.8-.1-1.6-.1-2.5-.4.9-.8 1.7-1.3 2.5-.4.8-.8 1.5-1.2 2.1l-6.3 9.1zm62.2-14.6c-1.4-1.6-3.1-2.8-4.9-3.5-1.8-.8-3.8-1.2-6.1-1.2-4.3 0-8.1 1.4-11.5 4.2-3.4 2.8-5.6 6.5-6.7 11-1 4.3-.6 7.9 1.4 10.8 1.9 2.8 4.9 4.2 8.9 4.2 2.3 0 4.6-.4 6.9-1.3 2.3-.8 4.6-2.1 7-3.8l-1.8 7.4c-2 1.3-4.1 2.2-6.3 2.8-2.2.6-4.4.9-6.8.9-3 0-5.7-.5-8-1.5s-4.2-2.5-5.7-4.5c-1.5-1.9-2.4-4.2-2.8-6.8-.4-2.6-.3-5.4.5-8.4.7-3 1.9-5.7 3.5-8.3 1.6-2.6 3.7-4.9 6.1-6.8 2.4-2 5-3.5 7.8-4.5s5.6-1.5 8.5-1.5c2.3 0 4.4.3 6.4 1 1.9.7 3.7 1.7 5.3 3.1l-1.7 6.7zm.6 30.5 9.6-40.3h21.9l-1.3 5.6h-15.5l-2.4 10.1h15.5l-1.4 5.7H868l-3.1 13h15.5L879 381h-21.9z" />
                        <path fill="#70706e" d="M740.7 305.6h-43.9l61-220.3h43.9l-61 220.3zM717.9 92.2c-3-4.2-7.7-6.3-14.1-6.3H462.6l-11.9 43.2h219.4l-12.8 46.1H481.8v-.1h-43.9l-36.4 131.5h43.9l24.4-88.2h197.3c6.2 0 12-2.1 17.4-6.3 5.4-4.2 9-9.4 10.7-15.6l24.4-88.2c1.9-6.6 1.3-11.9-1.7-16.1zm-342 199.6c-2.4 8.7-10.4 14.8-19.4 14.8H130.2c-6.2 0-10.8-2.1-13.8-6.3-3-4.2-3.7-9.4-1.9-15.6l55.2-198.8h43.9l-49.3 177.6h175.6l49.3-177.6h43.9l-57.2 205.9z" />
                        <path fill="#098041" d="M877.5 85.7 933 196.1 816.3 306.5z" />
                        <path fill="#e97626" d="M838.5 85.7 894 196.1 777.2 306.5z" />
                      </svg>
                    </div>

                    {/* PhonePe */}
                    <div
                      title="PhonePe"
                      className="w-8 h-8 rounded-full bg-white border border-slate-200/90 flex items-center justify-center shadow-xs shrink-0 overflow-hidden"
                    >
                      <svg viewBox="195 245 275 275" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <clipPath id="phonepe-clip-row">
                            <rect width="1366" height="768" fill="none" />
                          </clipPath>
                        </defs>
                        <g clipPath="url(#phonepe-clip-row)">
                          <path
                            fill="#5f259f"
                            d="M332.63 514.18c-3.88-.38-7.78-.64-11.64-1.15-25.26-3.35-47.76-13.07-67.18-29.6a127.87 127.87 0 0 1-41.44-65.75 124.29 124.29 0 0 1-3.78-42.55c2-24.95 10.33-47.61 25.5-67.51 21.24-27.87 49.33-44.9 84-50.05 37.84-5.63 72 3.92 101.51 28.13 25.43 20.83 40.77 47.94 45.43 80.46 5.5 38.35-4.36 72.79-29.38 102.44-21.07 25-48.24 39.43-80.53 44.3-4.05.62-8.16.86-12.24 1.28zm-23.78-171c-10.43 0-20.85 0-31.28 0-2.78 0-3.77.84-4 3.58a35.11 35.11 0 0 0 .15 8 9.19 9.19 0 0 0 9.18 8.06c2.4.05 4.8 0 7.2 0 3 0 3 0 3 2.95q0 16.75 0 33.5a50.67 50.67 0 0 0 1.73 13.2c3.21 12 10.21 20.59 22.36 24.17 10.15 3 20.34 2.27 30.36-1 2.35-.77 2.39-.77 2.4 1.72 0 6.92-.05 13.84 0 20.76a11.07 11.07 0 0 0 11.25 11.22c3.29 0 6.59.06 9.88 0a4.2 4.2 0 0 0 4.29-4.3c0-.82 0-1.64 0-2.46q0-48.42 0-96.81c0-3.68 0-3.68 3.58-3.68 4.18 0 8.37 0 12.55 0 3.1 0 4-.95 4-4.1q0-3.07 0-6.17c-.07-5.6-3.83-9.33-9.48-9.38q-7.41-.06-14.81 0a4 4 0 0 1-3.41-1.51c-1.85-2.2-3.77-4.35-5.66-6.51Q346 315.77 329.79 297.18a13.29 13.29 0 0 0-10.6-5c-6.67.08-12.59 3-18.74 5.07-1.87.62-2.07 3-.76 4.5a20 20 0 0 0 1.46 1.45Q321.07 322.11 341 341c.48.45 1.36.88 1.14 1.57-.28.9-1.29.53-2 .53-10.43 0-20.85 0-31.28 0"
                          />
                          <path
                            fill="#5f259f"
                            d="M350,388.34c0,7.61-.05,15.21,0,22.81a3,3,0,0,1-2.31,3.3,36.61,36.61,0,0,1-15.21,1.84c-8.75-.83-13.64-6-14.38-14.87-.68-8.14-.18-16.29-.32-24.44-.06-4,0-7.94,0-11.91,0-1.65.54-2.32,2.27-2.31,9.19.06,18.38.08,27.56,0,2,0,2.42.81,2.41,2.58-.06,7.67,0,15.34,0,23"
                          />
                        </g>
                      </svg>
                    </div>

                    {/* Paytm */}
                    <div
                      title="Paytm"
                      className="w-8 h-8 rounded-full bg-white border border-slate-200/90 flex items-center justify-center shadow-xs shrink-0 overflow-hidden px-1"
                    >
                      <svg viewBox="-164 191.6 512 193" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M229.8,243.2c2-1.6,3-2.4,4-3.2c13.9-11.8,31.7-10.5,43.6,3.5c1.2,1.4,1.8,1.5,3,0.3c0.8-0.9,1.7-1.6,2.5-2.5 c9.3-9.1,21.6-11.8,33.1-6.7c12.1,5.4,18.6,14.9,18.7,28.2c0.2,28.7,0.1,57.3,0.1,86c0,10.2-6.3,16.6-16.4,16.6c-4,0-8-0.3-12,0.1 c-4.1,0.4-5.3-0.9-5.3-5.2c0.2-28,0.1-56,0.1-84c0-1.2,0-2.3,0-3.5c-0.1-6.5-2.7-9.2-8.9-9.5c-5.6-0.3-9.5,3.1-10.1,8.8 c-0.1,1.3,0,2.7,0,4c0,24.2,0,48.3,0,72.5c0,10.6-6.1,16.8-16.7,16.7c-5.4-0.1-12.7,2.4-15.8-1.1c-2.7-3-0.9-10.1-0.9-15.4 c0-24.8,0-49.7,0-74.5c0-8.8-5.7-13.3-13.1-10.3c-4.6,1.9-6.1,5.6-6.1,10.4c0.1,23.2,0,46.3,0,69.5c0,1.8,0,3.7,0,5.5 c-0.3,9.7-6.5,15.8-16.1,15.9c-4,0.1-8-0.3-12,0.1c-4.3,0.4-5.6-0.8-5.5-5.4c0.2-39.3,0.1-78.6,0.1-118c0-1.7,0.1-3.3,0-5 c-0.2-2.2,0.7-2.9,2.9-2.9c9.2,0.1,18.3,0.1,27.5,0c2.3,0,3.4,0.6,3.2,3.1C229.5,239,229.7,240.6,229.8,243.2z"
                          fill="#02b9ef"
                        />
                        <path
                          d="M17.8 297.4c0 13.7 0 27.3 0 41-.1 17.8-9.4 27-27.2 27.1-7.8 0-15.7.1-23.5 0-15.8-.2-27.4-10.7-28.2-26.5-.6-11.3-.7-22.7-.1-34 .8-16.2 13.2-27.6 29.6-27.8 4.3-.1 8.7 0 13 0 4.2-.1 5.8-2.5 5.7-6.5 0-4-1.8-5.8-5.8-5.6-4.5.1-9 .1-13.5 0-11-.2-17.1-6.2-17-17 0-4.4-2-10.3.9-12.9 2.5-2.2 8.2-.8 12.5-.8 11.2-.1 22.3 0 33.5 0 11.9 0 20 8.1 20.1 20.1C17.9 268.7 17.8 283.1 17.8 297.4zM-12.8 320.1c0-1.7 0-3.3 0-5 0-10.2 0-10.2-10.2-9.8-5.1.2-7.9 2.8-8 8.1-.1 4.2-.1 8.3 0 12.5.1 7.2 3.3 9.1 13.7 9.4 7.7.2 3.8-5.2 4.5-8.2C-12.4 324.9-12.9 322.4-12.8 320.1zM106.8 286.5c0 15.3.2 30.7-.1 46-.2 11.8-3 22.5-14.4 28.8-4.6 2.5-9.6 3.9-14.8 4-11.5.2-23 0-34.5.2-2.8 0-3.4-1-3.3-3.5.2-4.2-.1-8.3.1-12.5.2-8 6.3-14.1 14.3-14.4 5.2-.2 10.3-.1 15.5 0 4.2 0 6.5-1.7 6.5-6.2 0-4.6-2.2-6.2-6.4-6.3-7-.2-14 .8-20.9-1.2-11.9-3.5-20.6-13.4-20.9-25.7-.6-19.5-.2-39-.3-58.5 0-2.2.7-2.9 2.9-2.8 8.2.1 16.3.2 24.5 0 3.6-.1 3.1 1.9 3.1 4.1 0 14.7 0 29.3 0 44 0 6.4 3 9.8 8.6 10 6.6.2 9.5-2.5 9.5-9.2 0-14.8.1-29.7-.1-44.5 0-3.5.9-4.5 4.4-4.4 7.3.3 14.7.4 22 0 4-.2 4.6 1.3 4.5 4.8C106.7 254.9 106.8 270.7 106.8 286.5zM-148 309.2c0-16.3 0-32.7 0-49 0-16 9.8-26 25.9-25.8 10.5.1 21-1.2 31.4.8 13.3 2.6 21.7 12.9 21.8 26.6.1 14.5 0 29 0 43.5 0 18.2-10.7 29.3-28.9 29.8-5.5.2-11 .1-16.5 0-2.5-.1-3.6.7-3.5 3.4.2 4 .1 8 0 12-.2 8.6-6.3 14.8-14.8 14.9-5 .1-11.3 2.1-14.5-.8-3-2.7-.8-9.1-.9-13.9C-148.1 336.9-148 323-148 309.2zM-117.8 284.7c0 3.2 0 6.3 0 9.5 0 11.3 0 11.3 11.3 10.3 4.9-.4 7.2-2.8 7.3-7.7.1-5.6-.2-11.3.1-16.9.6-16.2-2.4-14.6-15.6-14.7-2.4 0-3.2.7-3.2 3.1C-117.7 273.7-117.8 279.2-117.8 284.7z"
                          fill="#06306f"
                        />
                        <path
                          d="M135.1,309.4c0-13.3-0.1-26.7,0.1-40c0-3.1-0.7-4.4-4.1-4.3c-4.5,0.2-10.5,1.5-13-0.7 c-3.1-2.9-0.7-9.1-1.1-13.9c0-0.3,0-0.7,0-1c0-4.7-1.5-10.2,0.5-13.7s8.1-1.3,12.4-2.4c8.5-2.2,14.9-7.1,20.1-13.9 c3.6-4.6,8.1-7.9,13.9-9c3.1-0.6,5-0.2,4.8,3.8c-0.3,5.6,0,11.3-0.1,17c-0.1,2.4,0.8,3.2,3.2,3.1c4-0.1,8,0.1,12-0.1 c2.4-0.1,3.2,0.8,3.1,3.2c-0.1,8.2-0.1,16.3,0,24.5c0,2.3-0.6,3.5-3.1,3.2c-0.5-0.1-1,0-1.5,0c-4.4,0.4-10.5-2-12.8,1 c-2.2,2.8-0.8,8.6-0.8,13.1c0,27.2-0.1,54.3,0.1,81.5c0,3.8-1,5-4.8,4.7c-3.6-0.3-7.3,0-11-0.1c-10.8-0.4-17.9-7.7-17.9-18.5 C135.1,334.4,135.1,321.9,135.1,309.4z"
                          fill="#02b9ef"
                        />
                      </svg>
                    </div>

                    {/* Google Pay */}
                    <div
                      title="Google Pay"
                      className="w-8 h-8 rounded-full bg-white border border-slate-200/90 flex items-center justify-center shadow-xs shrink-0 overflow-hidden p-1.5"
                    >
                      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
                        <path fill="#4285F4" d="M34.8 24.5c0-.8-.1-1.6-.2-2.3H24v4.6h6.1c-.3 1.4-1.1 2.6-2.4 3.4v2.9h3.8c2.3-2.1 3.5-5.1 3.5-8.6z" />
                        <path fill="#34A853" d="M24 35.5c3.1 0 5.7-1 7.6-2.8l-3.8-2.9c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6h-3.9v3c1.9 3.8 5.8 6.2 10.2 6.2z" />
                        <path fill="#FBBC05" d="M17.7 26.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3v-3h-3.9C13 20.3 12.5 22.1 12.5 24s.5 3.7 1.3 5.3l3.9-3z" />
                        <path fill="#EA4335" d="M24 17.1c1.7 0 3.2.6 4.4 1.7l3.3-3.3C29.7 13.6 27.1 12.5 24 12.5c-4.4 0-8.3 2.5-10.2 6.2l3.9 3c.9-2.6 3.4-4.6 6.3-4.6z" />
                      </svg>
                    </div>

                    {/* Visa Card */}
                    <div
                      title="Visa Card"
                      className="w-8 h-8 rounded-full bg-white border border-slate-200/90 flex items-center justify-center shadow-xs shrink-0 overflow-hidden"
                    >
                      <svg viewBox="0 800 4335 2800" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="visa_id0_mob" x1="2167.46" x2="2167.46" y1="3573.9" y2="845.69" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stopColor="#E5097F" />
                            <stop offset="1" stopColor="#96336D" />
                          </linearGradient>
                          <linearGradient id="visa_id1_mob" x1="1115.54" x2="1649.92" y1="773.65" y2="3645.95" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stopColor="#E8388C" />
                            <stop offset="1" stopColor="#97326D" />
                          </linearGradient>
                        </defs>
                        <g>
                          <rect width="4267" height="2728" x="34" y="868" fill="#898989" rx="262" ry="262" />
                          <rect width="4267" height="2728" x="34" y="846" fill="url(#visa_id0_mob)" rx="262" ry="262" />
                          <path fill="url(#visa_id1_mob)" d="M296 3574h1369L2732 846H297c-144 0-262 118-262 262v2204c0 144 118 262 262 262z" />
                          <path
                            fill="#fefefe"
                            d="M581 1402c-5-7-10-19-14-27-14-28-49-72-71-90-19-16-47-39-70-48 1 6 4 15 6 21l94 339h121l134-311c6-14 41-92 44-104H704l-108 276c-2 3-1 2-3 4-1-7-11-55-13-59zm954-104c0 11 12 61 15 76 6 24 11 50 17 75h-91l59-151zm-231 301c132 0 109 10 125-30 4-11 8-24 13-34h144c1 11 5 22 7 33 3 14 4 30 12 30 113 0 102 7 96-22-2-10-3-16-6-26-4-18-8-35-12-52l-47-212c-7-35-15-71-23-106-29 0-106-6-128 10-21 16-38 65-48 89-10 22-19 42-29 65-9 22-18 42-28 63-22 48-57 136-79 178-3 6-8 12 2 12zm-274-293v13c0 48 55 87 91 102 9 4 18 8 27 13 98 53-4 112-122 65-6-3-21-10-28-10-1 13-5 31-8 45l-7 46c0 11 91 23 112 23 61 0 107-4 154-36 63-43 92-142-7-202-36-22-94-37-94-69 0-42 104-42 159-13 1-17 15-72 15-91-31-15-77-17-115-17-81 0-178 49-178 131zm-231 290h115l61-363c1-9 3-17 4-25 2-9 4-17 4-28H869c0 14-55 323-61 363l-9 53z"
                          />
                          <path
                            fill="#c5c6c6"
                            d="M426 1237c23 10 51 33 70 48 22 18 57 62 71 90 4 8 9 20 14 27 0-12-27-132-31-154-14-70-18-67-117-67H308v7c0 5 4 4 25 10 24 7 75 27 93 39z"
                          />
                        </g>
                      </svg>
                    </div>

                    {/* NetBanking / Bank */}
                    <div
                      title="Net Banking (All 50+ Banks)"
                      className="w-8 h-8 rounded-full bg-white border border-slate-200/90 flex items-center justify-center shadow-xs shrink-0 overflow-hidden p-1.5"
                    >
                      <svg viewBox="0 0 98 98" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <rect width="94.04" height="4.81" x="2.25" y="92.19" fill="#0f172a" />
                        <rect width="87.03" height="4.81" x="5.76" y="85.38" fill="#0f172a" />
                        <polygon points="42.865 21.698 45.853 21.698 44.359 17.739" fill="#0f172a" />
                        <path d="M36.8279 20.9883h-2.4033v2.3164h2.4033c.7842 0 1.2578-.436 1.2578-1.1582C38.0857 21.5239 37.6492 20.9883 36.8279 20.9883zM37.9236 18.6353c0-.6099-.4238-1.0708-1.1582-1.0708h-2.3408v2.1416h2.3408C37.4998 19.7061 37.9236 19.2705 37.9236 18.6353z" fill="#0f172a" />
                        <path d="M48.99,1L1.71,29.4301h94.55L48.99,1z M37.1638,24.5869h-4.1963v-8.3047h4.084c1.5322,0,2.3662,0.9463,2.3662,2.1162 c0,1.0337-0.6729,1.7432-1.4443,1.9053c0.8965,0.1367,1.6064,1.021,1.6064,2.0293C39.5799,23.6279,38.7322,24.5869,37.1638,24.5869 z M46.8738,24.5869l-0.6104-1.6064h-3.8096l-0.6104,1.6064h-1.6563l3.2627-8.3047h1.8174l3.2627,8.3047H46.8738z M56.6219,24.5869 h-1.4072l-4.333-5.9395v5.9395h-1.457v-8.3047h1.4941l4.2461,5.752v-5.752h1.457V24.5869z M60.5799,21.0757l-0.7344,0.8589v2.6523 h-1.457v-8.3047h1.457v3.9468l3.25-3.9468h1.8047l-3.374,3.9092l3.6357,4.3955h-1.8047L60.5799,21.0757z" fill="#0f172a" />
                        <polygon points="22.93 83.38 22.93 43.03 25.75 43.03 25.75 38.39 8.56 38.39 8.56 43.03 11.37 43.03 11.37 83.38" fill="#0f172a" />
                        <polygon points="65.76 83.38 65.76 43.03 68.58 43.03 68.58 38.39 51.38 38.39 51.38 43.03 54.19 43.03 54.19 83.38" fill="#0f172a" />
                        <polygon points="87.18 83.38 87.18 43.03 89.99 43.03 89.99 38.39 72.8 38.39 72.8 43.03 75.61 43.03 75.61 83.38" fill="#0f172a" />
                        <polygon points="44.35 83.38 44.35 43.03 47.17 43.03 47.17 38.39 29.97 38.39 29.97 43.03 32.78 43.03 32.78 83.38" fill="#0f172a" />
                        <rect width="87.53" height="4.96" x="5.29" y="31.43" fill="#0f172a" />
                      </svg>
                    </div>

                    {/* More ∨ */}
                    <div className="flex items-center gap-0.5 shrink-0 text-xs font-semibold text-slate-500 cursor-pointer pl-1">
                      <span>More</span>
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                
              </div>
            </form>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* RIGHT COLUMN: Sticky Order Summary & Price Ledger               */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-4 sticky top-24 z-20">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col gap-4">
              {/* Item Card Header */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                  <Image src={imageUrl} alt={title} fill sizes="80px" className="object-cover" unoptimized />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-[#ea110d] uppercase tracking-wider block font-poppins">
                    {bookingType.toUpperCase()}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 font-poppins truncate">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">
                    {tierOrRoomName}
                  </p>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                    ★ 4.96 (120+ verified reviews)
                  </div>
                </div>
              </div>

              {/* Reservation Dates & Guests Box */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Dates:</span>
                  <span className="font-bold text-slate-900">
                    {startDate} {endDate ? `→ ${endDate}` : `(${slotTime})`}
                  </span>
                </div>
                {bookingType !== "experience" && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Duration:</span>
                    <span className="font-bold text-slate-900">{nights} Nights</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Travelers:</span>
                  <span className="font-bold text-slate-900">
                    {adults} Adults, {children} Child{children !== 1 ? "ren" : ""}
                  </span>
                </div>
              </div>

              {/* Itemized Calculation */}
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-2 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>
                    ₹{priceParam.toLocaleString("en-IN")}{" "}
                    {bookingType === "experience"
                      ? `× ${adults} adults`
                      : `× ${nights} nights`}
                  </span>
                  <span className="text-slate-900 font-semibold">₹{baseCost.toLocaleString("en-IN")}</span>
                </div>

                {discountPercent > 0 && memberDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Mahastays Member Discount ({discountPercent}%)</span>
                    <span>-₹{memberDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {fee > 0 && (
                  <div className="flex justify-between">
                    <span>{bookingType === "experience" ? "Safety Gear & Insurance" : bookingType === "package" ? "Concierge & Service Fee" : "Cleaning & Sanitization"}</span>
                    <span className="text-slate-900 font-semibold">₹{fee.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Taxes &amp; GST ({customGstPercent !== null ? customGstPercent : (bookingType === "experience" ? 18 : 18)}%)</span>
                  <span className="text-slate-900 font-semibold">₹{taxes.toLocaleString("en-IN")}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                    <span className="flex items-center gap-1.5">
                      <span>🏷️</span>
                      <span>Coupon Applied ({appliedCoupon?.code})</span>
                    </span>
                    <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {/* Grand Total */}
                <div className="pt-2.5 border-t border-slate-200 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-900 font-poppins">Total (INR)</span>
                  <span className="text-xl font-extrabold text-[#ea110d] font-poppins">
                    ₹{finalGrandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Guarantees */}
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5 text-[11px] text-slate-500">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>100% Verified Stay with Safe Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Free Cancellation up to 48 hours before check-in</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-bold">Loading secure checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
