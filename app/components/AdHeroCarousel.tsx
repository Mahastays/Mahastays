"use client";

import { useState, useEffect } from "react";

export interface AdSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaTarget: string;
  image: string;
  categoryTag?: string;
}

interface AdHeroCarouselProps {
  slides: AdSlide[];
  onCtaClick?: (slide: AdSlide) => void;
}

export default function AdHeroCarousel({ slides, onCtaClick }: AdHeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-advance slides every 5.5 seconds
  useEffect(() => {
    if (isHovered || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isHovered, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const active = slides[currentSlide];

  const handleCta = (slide: AdSlide) => {
    if (onCtaClick) {
      onCtaClick(slide);
      return;
    }
    if (slide.ctaTarget.startsWith("#")) {
      const el = document.querySelector(slide.ctaTarget);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    } else {
      window.location.href = slide.ctaTarget;
    }
  };

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 pt-28 sm:pt-32 pb-4">
      <div
        className="relative w-full h-[360px] sm:h-[330px] lg:h-[350px] rounded-[28px] sm:rounded-[34px] overflow-hidden bg-gradient-to-r from-[#6b080b] via-[#5c0609] to-[#3f0204] shadow-[0_16px_45px_rgba(95,6,9,0.28)] border border-[#850f14]/60 group select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_65%)] pointer-events-none z-10" />

        {/* Slides Container */}
        {slides.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Left Image Area (covers ~50% on desktop) */}
              <div className="absolute inset-y-0 left-0 w-full sm:w-[50%] lg:w-[48%] overflow-hidden">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover object-[center_40%] scale-102 transition-transform duration-7000 ease-out"
                />
                {/* Subtle vignette on image edge */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Right Red Content Container with S-Curve Wave Divider */}
              <div className="absolute inset-y-0 right-0 left-[25%] sm:left-[45%] lg:left-[44%] bg-gradient-to-r from-[#69070a] via-[#5a0507] to-[#3d0203] z-10 flex flex-col justify-center px-6 sm:px-10 lg:px-14">
                {/* SVG Organic Wave Divider on left border of red panel */}
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute top-0 bottom-0 -left-12 sm:-left-16 lg:-left-20 w-12 sm:w-16 lg:w-20 h-full text-[#69070a] fill-current pointer-events-none drop-shadow-[-10px_0_12px_rgba(0,0,0,0.45)]"
                >
                  <path d="M100,0 C0,32 75,68 0,100 L100,100 Z" />
                </svg>

                {/* Content Elements */}
                <div className="relative z-20 max-w-xl">
                  {/* Eyebrow / Special Offer */}
                  <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-300 drop-shadow-sm flex items-center gap-1.5">
                      <span>{slide.badge}</span>
                      <span className="text-amber-400">🍃</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2 sm:mb-3 drop-shadow-md">
                    {slide.title}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-xs sm:text-sm lg:text-[15px] text-white/85 leading-relaxed mb-5 sm:mb-6 max-w-md drop-shadow-sm">
                    {slide.subtitle}
                  </p>

                  {/* Orange Pill CTA Button matching reference */}
                  <button
                    type="button"
                    onClick={() => handleCta(slide)}
                    className="inline-flex items-center gap-2.5 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF9E00] hover:from-[#FF881A] hover:to-[#FFA71A] text-white font-bold text-xs sm:text-sm shadow-[0_4px_18px_rgba(255,122,0,0.42)] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(255,122,0,0.55)] active:translate-y-0 transition-all cursor-pointer"
                  >
                    <span>{slide.ctaText}</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Decorative Tropical Flower Accent in Bottom-Right Corner */}
                <img
                  src="/tropical-flower.png"
                  alt="Decorative flower"
                  className="absolute -bottom-8 -right-6 sm:-bottom-10 sm:-right-8 w-44 sm:w-56 lg:w-64 pointer-events-none select-none drop-shadow-[0_8px_20px_rgba(0,0,0,0.4)] opacity-95 transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>
          );
        })}

        {/* Carousel Arrow Controls (Visible on hover or always subtle) */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous slide"
              className="hidden sm:flex absolute left-3.5 sm:left-5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-md border border-white/20 text-white items-center justify-center transition-all cursor-pointer shadow-md hover:scale-110 active:scale-95 opacity-80 group-hover:opacity-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next slide"
              className="hidden sm:flex absolute right-3.5 sm:right-5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-md border border-white/20 text-white items-center justify-center transition-all cursor-pointer shadow-md hover:scale-110 active:scale-95 opacity-80 group-hover:opacity-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Slide Dots Indicator */}
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/10">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlide ? "w-6 bg-amber-400" : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
