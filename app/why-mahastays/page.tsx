import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Why Mahastays? Verified Quality & Best Rate Guarantee",
  description:
    "Discover why discerning travelers choose Mahastays: 100% hand-inspected villas, direct host pricing with zero hidden fees, and round-the-clock local support.",
  alternates: {
    canonical: "/why-mahastays",
  },
};

export default function WhyMahastaysPage() {
  const comparisons = [
    {
      feature: "Property Verification",
      mahastays: "100% In-Person Inspected & Audited with 40-point checklist",
      others: "Unverified crowd-sourced listings with outdated photos",
    },
    {
      feature: "Pricing Transparency",
      mahastays: "Zero hidden check-in taxes, surprise service fees, or resort fees",
      others: "Rates inflate by 25-35% at the final payment step",
    },
    {
      feature: "On-Ground Concierge",
      mahastays: "Dedicated 24/7 WhatsApp host desk ready in under 15 mins",
      others: "Generic automated chatbot with multi-day ticketing delays",
    },
    {
      feature: "Member Privileges",
      mahastays: "Guaranteed 8% discount, early check-in & complimentary perks",
      others: "Points programs with expiring credits and heavy blackout dates",
    },
    {
      feature: "Local Experiences",
      mahastays: "Curated sunrise treks, private BBQ setups & boating passes",
      others: "Stay-only bookings with zero local coordination",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-roboto antialiased">
      <main className="flex-1 pt-28 sm:pt-34 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-14">
          <span className="text-xs font-bold tracking-widest uppercase text-[#ea110d] bg-red-50 px-3.5 py-1.5 rounded-full inline-block mb-3 font-poppins">
            Why Choose Us
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto font-poppins">
            Built for Travelers Who Demand Certainty and Luxury
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            When you travel to the hill-stations, you shouldn&apos;t have to worry about cold swimming pools, missing power backups, or unexpected charges. See how Mahastays stands apart.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="grid grid-cols-12 bg-slate-900 text-white p-4 sm:p-5 text-xs sm:text-sm font-bold font-poppins">
              <div className="col-span-4 sm:col-span-4">Experience Factor</div>
              <div className="col-span-4 sm:col-span-4 text-[#ff4b48] flex items-center gap-1.5">
                <span>★ Mahastays Guarantee</span>
              </div>
              <div className="col-span-4 sm:col-span-4 text-slate-400">Other Travel Portals</div>
            </div>

            <div className="divide-y divide-slate-100">
              {comparisons.map((c, i) => (
                <div key={i} className="grid grid-cols-12 p-4 sm:p-6 text-xs sm:text-sm items-center hover:bg-slate-50/60 transition">
                  <div className="col-span-4 font-bold text-slate-900 font-poppins pr-2">
                    {c.feature}
                  </div>
                  <div className="col-span-4 text-slate-900 font-medium pr-3 flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{c.mahastays}</span>
                  </div>
                  <div className="col-span-4 text-slate-500 flex items-start gap-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>{c.others}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-poppins">
            Experience the Mahastays Standard
          </h2>
          <p className="text-sm text-white/90 mt-2 max-w-lg mx-auto leading-relaxed">
            Browse our handpicked hill-station villas, lakefront retreats, and curated family packages today.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/explore"
              className="px-8 py-3 rounded-full bg-white text-[#ea110d] font-bold text-xs sm:text-sm shadow-md hover:bg-slate-100 transition font-poppins"
            >
              Browse Stays &amp; Villas →
            </Link>
            <Link
              href="/packages"
              className="px-8 py-3 rounded-full bg-black/25 text-white font-bold text-xs sm:text-sm hover:bg-black/40 transition font-poppins border border-white/20"
            >
              All-Inclusive Packages
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
