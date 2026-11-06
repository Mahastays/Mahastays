"use client";

import Image from "next/image";
import Link from "next/link";

export default function WhyChooseUsSection() {
  return (
    <section className="w-full bg-white py-14 sm:py-20 lg:py-24 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16 items-start">
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* LEFT COLUMN: Reason to Choose Us & Headline                     */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full pt-2">
            <div>
              {/* Overline Badge */}
              <div className="text-xs sm:text-sm font-bold text-[#ea110d] uppercase tracking-wider mb-4 font-poppins flex items-center gap-1.5">
                <span>—</span>
                <span>Why Mahastays</span>
              </div>

              {/* Display Headline */}
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold text-slate-900 tracking-tight leading-[1.2] mb-5 font-poppins">
                Handpicked luxury stays crafted for your perfect hill getaway
              </h2>

              {/* Subtext */}
              <p className="text-sm sm:text-base text-slate-500 font-normal leading-relaxed max-w-md font-roboto">
                We personally inspect and ground-audit every property, verifying private pools, valley views, and host hospitality so you can book with total confidence.
              </p>
            </div>

            {/* CTA Pill Button */}
            <div className="pt-8 sm:pt-12">
              <Link
                href="/explore"
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-slate-950 hover:bg-[#ea110d] text-white text-xs sm:text-sm font-bold shadow-[0_6px_20px_rgba(0,0,0,0.18)] hover:shadow-[0_8px_25px_rgba(234,17,13,0.35)] transition-all hover:-translate-y-0.5 active:translate-y-0 group font-poppins cursor-pointer"
              >
                <span>Explore Handpicked Stays</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:translate-x-1 transition-transform"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* RIGHT COLUMN: Bento Grid (Exact 3 Cards)                        */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {/* ── Card 1 (Top Left): 100% Handpicked & Ground Audited ── */}
              <div className="bg-[#f8f9fb] hover:bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)] transition-all duration-300 flex flex-col justify-between min-h-[220px]">
                {/* 40-Point Ground Audit Badge */}
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-xs font-semibold text-slate-800 font-poppins">
                    <svg className="w-4 h-4 text-[#ea110d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>40-Point Ground Audit</span>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5 font-poppins">
                    100% Handpicked &amp; Verified
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed font-roboto">
                    Every villa, pool resort, and estate is physically inspected to verify private pools, hygiene, and valley views before listing.
                  </p>
                </div>
              </div>

              {/* ── Card 2 (Top Right): Direct Host & Best Rates ── */}
              <div className="bg-[#f8f9fb] hover:bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)] transition-all duration-300 flex flex-col justify-between min-h-[220px]">
                {/* Dark Shield Badge Icon */}
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/10">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5 font-poppins">
                    Best Rates &amp; Zero Hidden Fees
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed font-roboto">
                    Direct host agreements guarantee honest, transparent pricing, instant confirmation, and zero surprise checkout charges.
                  </p>
                </div>
              </div>

              {/* ── Card 3 (Bottom, Full Width): Prime Scenic Locations ──────── */}
              <div className="sm:col-span-2 bg-[#f8f9fb] hover:bg-white rounded-[28px] p-6 sm:p-8 border border-slate-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)] transition-all duration-300 relative overflow-hidden">
                {/* Top Graphical Visual: Route Map & Stacked Photo Cards */}
                <div className="relative w-full h-36 sm:h-44 mb-4 flex items-center justify-between overflow-visible">
                  {/* Left: Dashed Path with Red Price Pill Tag */}
                  <div className="relative w-1/2 h-full flex items-center">
                    {/* SVG Curved Dashed Route Line */}
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 240 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M 20 80 Q 90 20, 160 50 T 230 40"
                        stroke="#cbd5e1"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                      <circle cx="20" cy="80" r="4" fill="#ea110d" />
                    </svg>

                    {/* Floating Price Pill Tag */}
                    <div className="absolute left-1/4 top-1/4 -translate-y-1/2 px-3 py-1 rounded-full bg-[#ea110d] text-white text-[11px] font-bold shadow-md shadow-[#ea110d]/25 flex items-center gap-1 font-poppins animate-bounce">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>₹14,999 / night</span>
                    </div>
                  </div>

                  {/* Right: Stacked Angled Photo Cards of Luxury Villa */}
                  <div className="relative w-1/2 h-full flex items-center justify-end pr-2 sm:pr-6">
                    {/* Background Stack Card (Tilted left) */}
                    <div className="absolute right-8 sm:right-12 w-28 sm:w-36 h-28 sm:h-32 rounded-xl bg-slate-200 border-2 border-white shadow-md rotate-[-8deg] overflow-hidden opacity-75">
                      <Image
                        src="/mountain-peaks.jpg"
                        alt="Sahyadri Peaks"
                        fill
                        loading="lazy"
                        className="object-cover"
                        sizes="144px"
                      />
                    </div>

                    {/* Foreground Main Card (Tilted right, active) */}
                    <div className="relative w-32 sm:w-44 h-32 sm:h-36 rounded-2xl bg-white border-2 border-white shadow-[0_10px_25px_rgba(0,0,0,0.14)] rotate-[4deg] overflow-hidden group hover:rotate-0 transition-transform duration-300">
                      <div className="relative w-full h-20 sm:h-24">
                        <Image
                          src="/hero-resort.jpg"
                          alt="Sunset Ridge Private Villa"
                          fill
                          loading="lazy"
                          className="object-cover"
                          sizes="176px"
                        />
                      </div>
                      <div className="p-2 sm:p-2.5 bg-white">
                        <div className="text-[10px] sm:text-xs font-bold text-slate-900 leading-tight font-poppins truncate">
                          Sunset Ridge Private Villa
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium font-roboto truncate">
                          Venna Lake, Mahabaleshwar
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5 font-poppins">
                    Stay Where the View Never Ends
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-xl font-roboto">
                    From tranquil Venna Lake waters and Table Land plateaus to Metgutad strawberry valleys and Tapola clifftops, wake up to Maharashtra&apos;s most breathtaking hill station landscapes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
