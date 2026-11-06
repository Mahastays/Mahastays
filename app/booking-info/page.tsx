import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Booking Information & Check-In Guide",
  description:
    "Complete guidelines on digital booking vouchers, ID verification, check-in & check-out times, pet policies, and house rules across Mahastays properties.",
  alternates: {
    canonical: "/booking-info",
  },
};

export default function BookingInfoPage() {
  const sections = [
    {
      title: "Instant Digital Voucher Delivery",
      desc: "The moment your booking payment succeeds, your official PDF Booking Voucher and invoice are delivered instantly to your registered Email and WhatsApp.",
      details: [
        "Instant WhatsApp alert with voucher link and QR check-in code",
        "Official PDF reservation document sent to your email",
        "Direct contact coordinates of your assigned on-ground host",
        "Google Maps GPS pin location and driving directions",
      ],
    },
    {
      title: "What to Carry for Check-in",
      desc: "For hassle-free check-in at partner resorts and private villas across Maharashtra, please have the following ready upon arrival:",
      details: [
        "Government-issued photo ID for all adult travelers (Aadhaar, Passport, or Driving License)",
        "Your digital Mahastays voucher on your phone (no physical printout needed)",
        "For foreign nationals, a valid Passport and Indian Visa are required by local regulations",
      ],
    },
    {
      title: "Check-in & Check-out Standard Timings",
      desc: "To ensure thorough sanitization and pool cleaning between stays, standard timings apply across most properties:",
      details: [
        "Standard Check-in: 1:00 PM – 2:00 PM onwards",
        "Standard Check-out: 10:00 AM – 11:00 AM",
        "Club Gold & VIP Members enjoy complimentary 2-hour early check-in or late check-out (subject to property availability)",
      ],
    },
    {
      title: "Secure Payment Methods",
      desc: "Mahastays partners with Razorpay to provide 100% RBI-compliant, bank-grade encrypted payment processing:",
      details: [
        "Instant UPI via PhonePe, Google Pay, Paytm, and BHIM",
        "All Major Credit & Debit Cards (Visa, MasterCard, RuPay, Amex)",
        "NetBanking across 50+ Indian commercial banks",
        "EMI options available on leading credit cards",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-roboto antialiased">
      <main className="flex-1 pt-28 sm:pt-34 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-14">
          <span className="text-xs font-bold tracking-widest uppercase text-[#ea110d] bg-red-50 px-3.5 py-1.5 rounded-full inline-block mb-3 font-poppins">
            Reservation Guide
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto font-poppins">
            Delivery &amp; Booking Information
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about instant digital voucher delivery, check-in requirements, host coordinates, and secure payment processing.
          </p>
        </div>

        {/* Content Cards */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 mb-16">
          {sections.map((sec, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4"
            >
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-poppins flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-red-50 text-[#ea110d] flex items-center justify-center text-xs font-black">
                  {i + 1}
                </span>
                <span>{sec.title}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {sec.desc}
              </p>
              <ul className="space-y-2 pt-2">
                {sec.details.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                    <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Support Help Card */}
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 font-poppins">
              Didn&apos;t receive your voucher email?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Check your spam folder, or log in to your account profile to download vouchers anytime.
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <Link
                href="/profile?tab=bookings"
                className="text-xs font-bold text-[#ea110d] hover:underline"
              >
                Access My Bookings →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
