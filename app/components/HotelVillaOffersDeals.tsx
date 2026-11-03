"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";

interface DealOffer {
  id: string;
  badge: {
    text: string;
    bg: string;
  };
  title: string;
  duration: string;
  location: string;
  originalPrice: string;
  dealPrice: string;
  image: string;
  href: string;
}

export default function HotelVillaOffersDeals() {
  const { items: properties, loading: propsLoading } = useAppSelector((state) => state.properties);
  const { items: packages, loading: pkgsLoading } = useAppSelector((state) => state.packages);

  // Build live deals dynamically from real DB records in store
  const liveDeals: DealOffer[] = [];

  properties.forEach((p, idx) => {
    liveDeals.push({
      id: p.id,
      badge: {
        text: p.badge || (p.propertyType === "villa" ? "Hot Villa Deal" : "Best Seller"),
        bg: idx % 2 === 0 ? "bg-[#2563eb]" : "bg-[#ea110d]",
      },
      title: p.name,
      duration: "Per Night",
      location: p.location,
      originalPrice: p.originalPrice
        ? `₹${p.originalPrice.toLocaleString("en-IN")}`
        : `₹${Math.round((p.numericPrice || 5000) * 1.3).toLocaleString("en-IN")}`,
      dealPrice: `₹${(p.numericPrice || 0).toLocaleString("en-IN")}`,
      image: p.images?.[0]?.url || p.gallery?.[0] || "/hero-resort.jpg",
      href: `/explore/${p.id}`,
    });
  });

  packages.forEach((pkg) => {
    liveDeals.push({
      id: pkg.id,
      badge: {
        text: pkg.badge || "Couple Special",
        bg: "bg-[#e11d48]",
      },
      title: pkg.title || pkg.name,
      duration: pkg.duration || `${pkg.durationDays}D / ${pkg.durationNights}N`,
      location: pkg.location,
      originalPrice: pkg.originalPrice
        ? `₹${pkg.originalPrice.toLocaleString("en-IN")}`
        : `₹${Math.round((pkg.numericPrice || 10000) * 1.3).toLocaleString("en-IN")}`,
      dealPrice: `₹${(pkg.numericPrice || 0).toLocaleString("en-IN")}`,
      image: pkg.images?.[0] || pkg.thumbnail || "/hero-resort.jpg",
      href: `/packages/${pkg.id}`,
    });
  });

  const displayDeals = liveDeals.slice(0, 3);
  const isLoading = (propsLoading || pkgsLoading) && displayDeals.length === 0;

  return (
    <section className="w-full bg-[#f8f9fa] py-12 sm:py-16 lg:py-20 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#ea110d] text-xs font-semibold mb-2 font-roboto">
              <span className="w-2 h-2 rounded-full bg-[#ea110d] animate-pulse" />
              <span>Special Booking Offers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-poppins">
              Hotel, Villa &amp; Resort Booking Offers
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 font-roboto max-w-xl">
              Handpicked weekend getaways and holiday packages at exclusive discounted member rates.
            </p>
          </div>

          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#ea110d] hover:text-[#c90e0b] group font-poppins transition-colors self-start sm:self-end"
          >
            <span>Browse all offers</span>
            <svg
              width="15"
              height="15"
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

        {/* Horizontal Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {/* 1. LEFT PROMO LEAD CARD */}
          <div className="relative rounded-[26px] overflow-hidden bg-gradient-to-br from-[#0b3b95] via-[#124fc2] to-[#072464] text-white p-6 sm:p-7 flex flex-col justify-between shadow-[0_12px_32px_rgba(11,59,149,0.25)] min-h-[340px] group">
            {/* Ambient Background Glows */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-blue-600/30 rounded-full blur-2xl pointer-events-none" />

            {/* Top Text Content */}
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-2 text-white font-poppins drop-shadow-xs">
                Top Deals <br />This Week
              </h3>
              <p className="text-xs sm:text-sm text-blue-100/85 font-normal leading-relaxed font-roboto">
                Limited time offers.<br />Don&apos;t miss out!
              </p>
            </div>

            {/* Middle Stylized 3D Globe Illustration */}
            <div className="relative z-10 my-auto py-3 flex items-center justify-center">
              <div className="relative w-44 h-28 flex items-center justify-center">
                <div className="absolute bottom-0 w-32 h-32 rounded-full bg-gradient-to-t from-[#0e52cf] via-[#2185f8] to-[#60a5fa] shadow-inner overflow-hidden flex items-center justify-center opacity-95">
                  <div className="absolute w-20 h-14 bg-emerald-500/80 rounded-full blur-[1px] -top-2 left-3 transform rotate-12" />
                  <div className="absolute w-16 h-18 bg-emerald-400/80 rounded-full blur-[1px] bottom-1 right-2" />
                  <div className="absolute w-12 h-10 bg-amber-300/60 rounded-full blur-[1px] top-6 right-5" />
                  <div className="absolute top-8 left-14 w-4 h-4 rounded-full bg-[#ea110d] border-2 border-white shadow-md flex items-center justify-center text-[7px] font-black text-white">
                    📍
                  </div>
                </div>

                <div className="absolute bottom-3 -left-2 w-14 h-6 bg-white/40 backdrop-blur-xs rounded-full blur-[0.5px]" />
                <div className="absolute top-1 right-1 w-12 h-5 bg-white/40 backdrop-blur-xs rounded-full blur-[0.5px]" />

                <div className="absolute top-2 -right-1 z-20 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500">
                  <svg
                    width="110"
                    height="70"
                    viewBox="0 0 200 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
                  >
                    <path
                      d="M 20,60 Q 90,45 160,50 Q 185,52 195,58 Q 185,65 150,68 Q 80,72 20,60 Z"
                      fill="#ffffff"
                    />
                    <path
                      d="M 90,55 L 45,15 Q 55,10 75,20 L 125,56 Z"
                      fill="#e2e8f0"
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                    <path
                      d="M 85,65 L 55,105 Q 65,110 80,105 L 120,66 Z"
                      fill="#cbd5e1"
                    />
                    <path
                      d="M 20,60 L 5,25 Q 15,20 28,25 L 42,58 Z"
                      fill="#ea110d"
                    />
                    <circle cx="110" cy="56" r="2" fill="#0f172a" />
                    <circle cx="120" cy="56" r="2" fill="#0f172a" />
                    <circle cx="130" cy="56" r="2" fill="#0f172a" />
                    <circle cx="140" cy="57" r="2" fill="#0f172a" />
                    <circle cx="150" cy="57" r="2" fill="#0f172a" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="relative z-10 pt-2">
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 font-poppins group-hover:bg-white"
              >
                <span>Grab Deals</span>
                <span className="font-bold">→</span>
              </Link>
            </div>
          </div>

          {/* Skeletons while loading */}
          {isLoading &&
            [1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="bg-white rounded-[26px] h-[340px] border border-slate-100 animate-pulse bg-slate-200/70"
              />
            ))}

          {/* Real Live Deal Cards from Redux Store */}
          {displayDeals.map((deal) => (
            <div
              key={deal.id}
              className="bg-white rounded-[26px] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_34px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
            >
              {/* Card Image Area */}
              <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-slate-100">
                <Image
                  src={deal.image}
                  alt={deal.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 300px"
                  unoptimized={deal.image.startsWith("http")}
                />

                {/* Offer Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold text-white shadow-sm font-poppins ${deal.badge.bg}`}
                  >
                    {deal.badge.text}
                  </span>
                </div>
              </div>

              {/* Card Content Area */}
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug mb-1 font-poppins line-clamp-1 group-hover:text-[#ea110d] transition-colors">
                    {deal.title}
                  </h4>
                  <div className="text-xs text-slate-500 font-normal mb-3 font-roboto flex items-center justify-between">
                    <span>{deal.duration}</span>
                    <span className="text-slate-400">•</span>
                    <span className="truncate max-w-[130px]">{deal.location}</span>
                  </div>
                </div>

                {/* Price Row */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-baseline gap-2.5 mb-3">
                    <span className="text-xs sm:text-sm text-slate-400 line-through font-normal font-roboto">
                      {deal.originalPrice}
                    </span>
                    <span className="text-xl sm:text-2xl font-semibold text-slate-900 font-poppins">
                      {deal.dealPrice}
                    </span>
                  </div>

                  {/* View Details Link */}
                  <Link
                    href={deal.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1e40af] hover:text-[#ea110d] transition-colors font-poppins group/link"
                  >
                    <span>View Details</span>
                    <span className="transition-transform group-hover/link:translate-x-1 font-bold">
                      →
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
