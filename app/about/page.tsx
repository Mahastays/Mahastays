import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "About Us – Redefining Luxury Stays in Mahabaleshwar",
  description:
    "Learn about Mahastays, our 100% verified luxury villas, hillside pool resorts, and 24/7 on-ground concierge across Mahabaleshwar and Panchgani.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  const stats = [
    { label: "Handpicked Stays", value: "50+" },
    { label: "Verified Villas & Resorts", value: "100% Inspected" },
    { label: "Guest Satisfaction", value: "100%" },
    { label: "Dedicated Concierge Support", value: "24/7" },
  ];

  const pillars = [
    {
      title: "100% Handpicked & Inspected",
      desc: "Every villa, pool resort, and hillside estate in our catalog undergoes rigorous 40-point quality inspections before listing.",
      icon: (
        <svg className="w-6 h-6 text-[#ea110d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Best Rate Guarantee",
      desc: "Direct-from-host agreements ensure you always receive the lowest publicly available price with zero hidden check-in fees.",
      icon: (
        <svg className="w-6 h-6 text-[#ea110d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "24/7 On-Ground Concierge",
      desc: "Our local hosts in Mahabaleshwar and Panchgani assist with private barbecues, bonfires, guided treks, and urgent needs anytime.",
      icon: (
        <svg className="w-6 h-6 text-[#ea110d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-6a9 9 0 0118 0v6M3 18a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5zm18 0a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h1v5z" />
        </svg>
      ),
    },
    {
      title: "Curated Local Experiences",
      desc: "From Venna Lake sunset boating to organic strawberry farm tastings, we turn standard hotel stays into lifelong memories.",
      icon: (
        <svg className="w-6 h-6 text-[#ea110d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-roboto antialiased">
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-34 pb-20">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <span className="text-xs font-bold tracking-widest uppercase text-[#ea110d] bg-red-50 px-3.5 py-1.5 rounded-full inline-block mb-3 font-poppins">
            About Mahastays
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto font-poppins">
            Redefining Luxury Stays Across Maharashtra&apos;s Western Ghats
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Founded with a passion for soulful hill-station getaways, Mahastays connects travelers with the finest private pool villas, heritage estates, and boutique resorts in Mahabaleshwar, Panchgani, and beyond.
          </p>
        </div>

        {/* Brand Story with Image */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-poppins leading-snug">
                Born in the Misty Valleys of Mahabaleshwar
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                We started Mahastays with a simple observation: finding a truly reliable, private, and premium villa getaway in the hills was full of guesswork, inconsistent photos, and hidden costs.
              </p>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                We changed that by creating a closed, verified network. We personally visit every property, test the water heaters and Wi-Fi, verify pool filtration, sample the chef&apos;s meals, and partner directly with property owners to guarantee transparent pricing and flawless check-ins.
              </p>
              <div className="pt-2 flex items-center gap-4">
                <Link
                  href="/explore"
                  className="px-6 py-3 rounded-full bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs sm:text-sm font-bold shadow-md shadow-red-500/20 transition-all font-poppins cursor-pointer"
                >
                  Explore Verified Stays →
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all font-poppins cursor-pointer"
                >
                  Contact Concierge
                </Link>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-4/3">
              <img
                src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop&q=80"
                alt="Luxury resort poolside"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                <p className="text-white text-sm font-medium">Handcrafted stays designed for memorable gatherings and peaceful escapes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
              >
                <span className="text-3xl sm:text-4xl font-extrabold text-[#ea110d] font-poppins block">
                  {stat.value}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-600 mt-1 block">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pillars / Values Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-poppins">
              The Mahastays Difference
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Every detail engineered so you can relax the moment you arrive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((p, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  {p.icon}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                    {p.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
