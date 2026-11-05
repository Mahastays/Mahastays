"use client";

import Link from "next/link";

interface CategoryCard {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  icon: React.ReactNode;
  shapeStyle: string;
}

const CATEGORY_CARDS: CategoryCard[] = [
  {
    id: "trekking",
    title: "Trekking",
    subtitle: "Lingmala Secret Waterfall",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306",
    href: "/experiences/act1002",
    shapeStyle: "rounded-[34px_34px_22px_22px] sm:rounded-[42px_42px_26px_26px]",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
      </svg>
    ),
  },
  {
    id: "boating",
    title: "Boating",
    subtitle: "Venna Lake Shikara Cruise",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    href: "/experiences/act1001",
    shapeStyle: "rounded-[28px_40px_22px_22px] sm:rounded-[34px_48px_26px_26px]",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "villas",
    title: "Villas",
    subtitle: "Misty Cliff Valley Villa",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
    href: "/explore/p5002",
    shapeStyle: "rounded-[38px_26px_22px_22px] sm:rounded-[46px_30px_26px_26px]",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "resorts",
    title: "Resorts",
    subtitle: "HillView Luxury Resort",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    href: "/explore/p5001",
    shapeStyle: "rounded-[26px_38px_22px_22px] sm:rounded-[32px_44px_26px_26px]",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
      </svg>
    ),
  },
];

export default function ExperienceShowcaseBanner() {
  return (
    <section className="max-w-7xl mx-auto my-10 sm:my-14 px-6 w-full bg-transparent">
      {/* ─── Transparent Fluid Layout ─────────────────────────────── */}
      <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-10 lg:gap-12 w-full">
        {/* ─── Left Column: Original Clean Text + CTA Button ───────── */}
        <div className="w-full lg:w-[34%] xl:w-[32%] flex flex-col items-start shrink-0 text-left">
          {/* Tagline with red dash */}
          <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
            <span className="w-5 sm:w-6 h-[2px] bg-[#ea110d] rounded-full inline-block shrink-0" />
            <span className="text-[11px] sm:text-xs font-black tracking-widest uppercase text-[#ea110d]">
              MORE THAN A STAY
            </span>
          </div>

          {/* Original Clean Sans Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-2 sm:mb-3">
            Experiences That Stay{" "}
            <span className="text-[#ea110d]">Forever</span>
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-sm mb-5 sm:mb-6">
            From tropical beaches to mountain retreats — find stays that match your vibe.
          </p>

          {/* CTA Button Redirecting to /explore */}
          <Link
            href="/explore"
            className="inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#ea110d] via-[#f03b2c] to-[#ff4e42] text-white text-xs sm:text-sm font-bold shadow-[0_8px_24px_rgba(234,17,13,0.32)] hover:shadow-[0_10px_28px_rgba(234,17,13,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
            id="home-explore-experiences-cta"
          >
            <span>Explore Experiences</span>
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
              <path d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* ─── Right Column: 4 Distinct Curvy Cards with White Circular Badges ─ */}
        <div className="relative w-full lg:w-[64%] xl:w-[67%]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-4.5">
            {CATEGORY_CARDS.map((card) => {
              return (
                <Link
                  key={card.id}
                  href={card.href}
                  className={`group relative h-[220px] sm:h-[245px] lg:h-[265px] w-full overflow-hidden ${card.shapeStyle} shadow-[0_10px_26px_rgba(0,0,0,0.12)] border border-slate-200/60 hover:-translate-y-1.5 hover:shadow-[0_18px_36px_rgba(0,0,0,0.2)] transition-[transform,box-shadow] duration-250 ease-out transform-gpu select-none block bg-slate-900 cursor-pointer`}
                  id={`home-category-${card.id}`}
                >
                  {/* Background Photo */}
                  <img
                    src={card.image}
                    alt={card.title}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out transform-gpu"
                  />

                  {/* High Contrast Bottom Dark Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 via-50% to-transparent pointer-events-none" />

                  {/* Bottom Content Area: White Circular Badge, Title, Subtitle */}
                  <div className="absolute bottom-4 inset-x-3 sm:inset-x-3.5 z-10 flex flex-col items-start text-left">
                    {/* White Circular Icon Badge (As in Reference Image) */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-md mb-2 shrink-0 group-hover:scale-110 group-hover:bg-[#ea110d] group-hover:text-white transition-all duration-300">
                      {card.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug drop-shadow-xs">
                      {card.title}
                    </h3>

                    {/* Subtitle with Arrow */}
                    <div className="flex items-center gap-1 text-[11px] sm:text-xs font-medium text-white/75 group-hover:text-white transition-colors leading-tight mt-0.5">
                      <span>{card.subtitle}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-0.5 transition-transform">
                        <path d="M5 12h14m-7-7 7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Floating Right Chevron Action Button (As in Reference Image) */}
          <Link
            href="/explore"
            className="hidden xl:flex absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-slate-50 text-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.18)] items-center justify-center border border-slate-200/80 transition-all hover:scale-110 active:scale-95 cursor-pointer"
            aria-label="View more stays in explore"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
