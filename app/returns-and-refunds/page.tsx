import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description:
    "Clear, transparent cancellation guidelines with 100% full refund options up to 48 hours prior to check-in, wallet credits, and instant refund processing at Mahastays.",
  alternates: {
    canonical: "/returns-and-refunds",
  },
};

export default function ReturnsAndRefundsPage() {
  const tiers = [
    {
      timing: "48+ Hours Prior to Check-in",
      refund: "100% Full Refund",
      badge: "Free Cancellation",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      desc: "Cancel anytime up to 48 hours before the standard property check-in time (usually 1:00 PM) to receive a full refund with zero cancellation fee.",
    },
    {
      timing: "24 – 48 Hours Prior to Check-in",
      refund: "50% Refund or 100% Wallet Credit",
      badge: "Partial Refund / Reschedule",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      desc: "Receive 50% cash refund to your payment method or choose 100% Mahastays wallet credit to reschedule your trip anytime within 6 months.",
    },
    {
      timing: "Under 24 Hours / No Show",
      refund: "Non-Refundable",
      badge: "Final Lock-in",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      desc: "Due to last-minute villa holding and chef provisioning, reservations cancelled less than 24 hours prior to check-in are strictly non-refundable.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-roboto antialiased">
      <main className="flex-1 pt-28 sm:pt-34 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-[#ea110d] bg-red-50 px-3.5 py-1.5 rounded-full inline-block mb-3 font-poppins">
              Cancellation Guidelines
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-poppins">
              Returns, Cancellations &amp; Refund Policy
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Clear, transparent cancellation rules designed with traveler flexibility in mind.
            </p>
          </div>

          <div className="space-y-6 mb-12">
            {tiers.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                    {t.timing}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${t.badgeColor}`}>
                    {t.badge}
                  </span>
                </div>
                <div className="text-lg font-black text-[#ea110d] font-poppins">
                  {t.refund}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <h3 className="text-base font-bold text-slate-900 font-poppins">
              Refund Processing Timelines
            </h3>
            <p>
              Once a cancellation is approved, refunds are credited back to the original payment source (UPI, Debit/Credit Card, or NetBanking) within <strong>3 to 5 business days</strong>.
            </p>
            <p>
              If you opted for Instant Mahastays Wallet Credit, the funds are added to your profile immediately and can be applied directly at checkout on any future booking.
            </p>
            <div className="pt-2">
              <Link
                href="/profile?tab=bookings"
                className="text-xs font-bold text-[#ea110d] hover:underline"
              >
                Manage My Bookings to Cancel or Reschedule →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
