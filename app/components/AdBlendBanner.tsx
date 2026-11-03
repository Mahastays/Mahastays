"use client";

import { useState, useEffect } from "react";

export interface AdFeatureItem {
  icon?: "bed" | "dining" | "compass" | "star" | "sparkles";
  label: string;
}

export interface AdBlendSlide {
  id: string;
  badge?: string; // e.g. "Sponsored"
  title: string;
  subtitle: string;
  features: AdFeatureItem[];
  ctaText: string;
  price: string;
  priceUnit?: string; // e.g. "/ night", "/ person", "/ couple"
  image: string;
  filterDestination?: string;
  filterCategory?: string;
  filterAmenity?: string;
  rawSlide?: any;
}

interface AdBlendBannerProps {
  slides: AdBlendSlide[];
  onSelectSlide?: (slide: AdBlendSlide) => void;
  ctaDefaultTargetId?: string;
  id?: string;
}

export default function AdBlendBanner({
  slides,
  onSelectSlide,
  ctaDefaultTargetId = "catalog-section",
  id = "ad-blend-banner",
}: AdBlendBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [isDismissed, setIsDismissed] = useState(false);

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    if (isHovered || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isHovered, slides.length]);

  if (isDismissed) return null;

  const active = slides[currentSlide] || slides[0];
  if (!active) return null;

  const isCurrentLiked = !!likedMap[active.id];

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedMap((prev) => ({
      ...prev,
      [active.id]: !prev[active.id],
    }));
  };

  const handleCta = () => {
    if (onSelectSlide) {
      onSelectSlide(active);
    } else if (ctaDefaultTargetId) {
      const catalogEl = document.getElementById(ctaDefaultTargetId);
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 pt-20 sm:pt-28 pb-4">
      <div
        className="relative w-full rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-slate-200/80 bg-white group select-none flex flex-col justify-between sm:block sm:h-[340px] lg:h-[350px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        id={id}
      >
        {/* ─── Background Full-Bleed Photograph Layer ───────── */}
        {slides.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-0 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center scale-101 transition-transform duration-7000 ease-out"
              />
            </div>
          );
        })}

        {/* ─── White-to-Image Horizontal Gradient Blend ─────── */}
        {/* Desktop / Tablet Blend: Pure solid white on the left (0-38%), smooth horizontal dissolve into the photograph */}
        <div
          className="absolute inset-0 pointer-events-none z-10 hidden sm:block"
          style={{
            background:
              "linear-gradient(to right, #ffffff 0%, #ffffff 38%, rgba(255, 255, 255, 0.96) 46%, rgba(255, 255, 255, 0.75) 54%, rgba(255, 255, 255, 0.35) 62%, rgba(255, 255, 255, 0) 72%)",
          }}
        />
        {/* Mobile Blend (Provides extra opacity so typography is crystal clear) */}
        <div
          className="absolute inset-0 pointer-events-none z-10 sm:hidden"
          style={{
            background:
              "linear-gradient(to right, #ffffff 0%, #ffffff 72%, rgba(255, 255, 255, 0.92) 88%, rgba(255, 255, 255, 0.5) 100%)",
          }}
        />

        {/* ─── Bottom-Left Botanical Leaf Silhouette Accent (As in Reference) ─ */}
        <div className="absolute -bottom-8 -left-6 w-48 sm:w-60 h-36 sm:h-48 pointer-events-none z-10 opacity-30 sm:opacity-40 filter blur-[1.2px] select-none">
          <svg viewBox="0 0 200 150" fill="none" className="w-full h-full transform -rotate-6">
            <path
              d="M -10 160 C 30 130, 80 80, 150 30"
              stroke="#164e3f"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 150 30 C 135 15, 105 22, 102 38 C 99 54, 130 48, 150 30 Z"
              fill="#1b4d3e"
            />
            <path
              d="M 115 55 C 95 40, 70 46, 72 65 C 74 80, 102 74, 115 55 Z"
              fill="#2d6a4f"
            />
            <path
              d="M 110 65 C 130 55, 152 68, 145 88 C 138 102, 118 86, 110 65 Z"
              fill="#1e5642"
            />
            <path
              d="M 78 92 C 58 78, 35 88, 38 108 C 41 120, 68 112, 78 92 Z"
              fill="#2d6a4f"
            />
            <path
              d="M 72 102 C 92 90, 114 105, 108 122 C 102 135, 82 120, 72 102 Z"
              fill="#1e5642"
            />
          </svg>
        </div>

        {/* ─── Top-Right Wishlist Floating Button ────────────── */}
        <button
          type="button"
          onClick={toggleWishlist}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-100 flex items-center justify-center cursor-pointer hover:scale-108 active:scale-95 transition-all text-slate-700 group/heart"
          aria-label="Save to wishlist"
        >
          <svg
            viewBox="0 0 24 24"
            fill={isCurrentLiked ? "#ea110d" : "none"}
            stroke={isCurrentLiked ? "#ea110d" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover/heart:scale-110"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>

        {/* ─── Bottom-Right Floating Price Card (Desktop Only - Mobile combines price cleanly below) ─ */}
        <div
          onClick={handleCta}
          className="hidden sm:flex absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.12)] border border-slate-100 p-3 sm:p-3.5 px-4 sm:px-5 items-center gap-3.5 sm:gap-4 hover:scale-[1.03] transition-all duration-300 cursor-pointer group/price max-w-[90vw] sm:max-w-none"
        >
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block leading-tight">
              From
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-[#ea110d] tracking-tight leading-none font-poppins">
                {active.price}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {active.priceUnit || "/ night"}
              </span>
            </div>
          </div>

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-100 text-slate-900 flex items-center justify-center font-bold text-sm shrink-0 group-hover/price:bg-[#ea110d] group-hover/price:text-white transition-all shadow-2xs">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5 group-hover/price:translate-x-0.5 transition-transform"
            >
              <path d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* ─── Content Layout (Badge, Title, Subtitle, Features, CTA) ─ */}
        <div className="relative sm:absolute sm:inset-y-0 sm:left-0 w-full sm:w-[60%] md:w-[52%] lg:w-[46%] xl:w-[44%] z-20 p-4 sm:p-8 lg:p-10 flex flex-col justify-between pointer-events-auto h-full min-h-0">
          {/* Top Section */}
          <div>
            {/* Pill Badge: Featured Collection + Mobile Slide Dots */}
            <div className="flex items-center justify-between mb-2 sm:mb-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-rose-50/90 border border-rose-100 text-[#ea110d] text-[10.5px] sm:text-xs font-bold w-fit shadow-2xs">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#ea110d]">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>{active.badge && active.badge.toLowerCase() !== "sponsored" ? active.badge : "Featured Collection"}</span>
              </div>

              {/* Mobile Slide Dots */}
              {slides.length > 1 && (
                <div className="flex sm:hidden items-center gap-1 pr-12">
                  {slides.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      className={`transition-all duration-300 rounded-full cursor-pointer ${
                        idx === currentSlide
                          ? "w-4 h-1.5 bg-[#ea110d]"
                          : "w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bold Headline */}
            <h2 className="text-xl sm:text-3xl lg:text-[34px] font-extrabold text-slate-900 tracking-tight leading-[1.18] mb-1.5 sm:mb-2 font-poppins pr-8 sm:pr-0">
              {active.title}
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-[420px] line-clamp-2 mb-2.5 sm:mb-4">
              {active.subtitle}
            </p>

            {/* Feature Amenities Row with Clean Icons */}
            <div className="flex items-center flex-wrap gap-2.5 sm:gap-6 text-slate-700 text-xs sm:text-[13px] font-semibold pt-0.5">
              {active.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                  {feat.icon === "bed" && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 shrink-0"
                    >
                      <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" />
                    </svg>
                  )}
                  {feat.icon === "dining" && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 shrink-0"
                    >
                      <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 11v11M5 2v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2M7 12v10" />
                    </svg>
                  )}
                  {feat.icon === "compass" && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                  )}
                  <span>{feat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Bottom Action Area: CTA Button + Slide Indicator Dots */}
          <div className="hidden sm:flex items-center gap-4 sm:gap-5 pt-2 sm:pt-3">
            <button
              type="button"
              onClick={handleCta}
              className="inline-flex items-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs sm:text-sm font-bold shadow-[0_8px_20px_rgba(234,17,13,0.32)] hover:shadow-[0_10px_26px_rgba(234,17,13,0.46)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group/cta"
            >
              <span>{active.ctaText}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 group-hover/cta:translate-x-1 transition-transform"
              >
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </button>

            {/* Slide Navigation Dots */}
            {slides.length > 1 && (
              <div className="flex items-center gap-1.5">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentSlide(idx)}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      idx === currentSlide
                        ? "w-6 h-1.5 bg-[#ea110d]"
                        : "w-2 h-1.5 bg-slate-300 hover:bg-slate-400"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Mobile Bottom Action: Price on Left, CTA Button on Right (Zero overlap!) */}
          <div className="flex sm:hidden items-center justify-between gap-3 pt-2.5 mt-3 border-t border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-tight">
                From
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-[#ea110d] font-poppins leading-tight">
                  {active.price}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {active.priceUnit || "/ night"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCta}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs font-bold shadow-[0_4px_16px_rgba(234,17,13,0.3)] active:scale-95 transition-all cursor-pointer"
            >
              <span>{active.ctaText}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* ─── Subtle Prev/Next Navigation Controls (Desktop/Tablet hover only, hidden on phone screens) ─ */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
              }}
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md items-center justify-center opacity-0 group-hover:opacity-90 hover:opacity-100 transition-all cursor-pointer border border-slate-200"
              aria-label="Previous slide"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide((prev) => (prev + 1) % slides.length);
              }}
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md items-center justify-center opacity-0 group-hover:opacity-90 hover:opacity-100 transition-all cursor-pointer border border-slate-200"
              aria-label="Next slide"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>
    </section>
  );
}
