import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Best Rate Guarantee",
  description:
    "We guarantee the lowest publicly available prices on all verified Mahabaleshwar villas, resorts, and vacation packages. Direct-from-host transparent pricing.",
  alternates: {
    canonical: "/best-rate-guarantee",
  },
};

export default function BestRateGuaranteePage() {
  const steps = [
    {
      step: "01",
      title: "Book Directly on Mahastays",
      desc: "Reserve any villa, luxury suite, or package on Mahastays at our transparent, direct-host rate.",
    },
    {
      step: "02",
      title: "Find a Lower Public Rate?",
      desc: "If you find a lower publicly available rate for the identical property, room category, and dates within 24 hours of booking.",
    },
    {
      step: "03",
      title: "Submit a Quick Claim",
      desc: "Share the link or screenshot with our 24/7 concierge via WhatsApp or our claim form. We review in under 4 hours.",
    },
    {
      step: "04",
      title: "We Match + Give 10% Extra Off",
      desc: "Once verified, we adjust your reservation price to match the lower rate and grant an extra 10% discount on your stay.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-roboto antialiased">
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-34 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-14">
          <span className="text-xs font-bold tracking-widest uppercase text-[#ea110d] bg-red-50 px-3.5 py-1.5 rounded-full inline-block mb-3 font-poppins">
            Price Promise
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto font-poppins">
            Mahastays Best Rate &amp; Price Match Guarantee
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We partner directly with villa owners and resort management without middleman aggregators. You will always get the best price when you book directly with us.
          </p>
        </div>

        {/* 4-Step Process */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col justify-between"
              >
                <div>
                  <span className="text-3xl font-black text-rose-500 font-poppins block mb-3">
                    {s.step}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 font-poppins">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eligibility Details */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-poppins">
              Guarantee Terms &amp; Conditions
            </h2>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed list-disc list-inside">
              <li>The lower rate must be viewable and bookable online by the general public at the time of claim verification.</li>
              <li>The property, room category, check-in and check-out dates, guest count, and cancellation policies must be identical.</li>
              <li>Does not apply to unpublished corporate rates, offline private member clubs, or opaque auction websites.</li>
              <li>Claims must be submitted within 24 hours of completing your reservation on Mahastays.</li>
            </ul>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-poppins">Need to submit a price match claim?</h4>
                <p className="text-xs text-slate-500">Our concierge desk processes claims within 4 hours.</p>
              </div>
              <Link
                href="/contact"
                className="px-6 py-2.5 rounded-full bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-xs font-poppins transition shadow-md shadow-red-500/20"
              >
                Submit Claim to Concierge →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
