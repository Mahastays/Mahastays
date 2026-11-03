"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { ExperienceCardSkeleton } from "./Skeletons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchExperiences } from "@/store/slices/experienceslice";

export default function ActivitiesExperiences() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.experiences);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    dispatch(fetchExperiences());
  }, [dispatch]);

  const activities = useMemo(() => {
    return items.map((e) => ({
      id: e.id,
      title: e.title || e.name,
      country: e.city || e.country || "Mahabaleshwar",
      flag: e.flag || "🍓",
      image: e.image || e.gallery?.[0] || "/hero-resort.jpg",
      duration: e.duration,
      rating: e.rating || (e.ratingScore ? `${e.ratingScore}/5 ★` : "4.9/5 ★"),
      price: e.price || `₹${e.numericPrice?.toLocaleString("en-IN")}`,
      description: e.description,
    }));
  }, [items]);

  const total = activities.length;

  const handlePrev = () => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev + 1) % total);
  };

  // Touch swipe support for smooth mobile interaction
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 45) {
      handlePrev();
    } else if (diff < -45) {
      handleNext();
    }
    touchStartX.current = null;
  };

  // Smooth auto-rotate every 5.5s when not hovered or active
  useEffect(() => {
    if (isHovered || total <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered, total]);

  return (
    <section className="max-w-7xl mx-auto my-20 px-6 w-full overflow-hidden" id="activities">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-bold text-slate-900 tracking-tight leading-tight mb-3">
          Popular Activities &amp; <span className="text-primary">Experiences</span> in Mahabaleshwar
        </h2>
        <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
          Guided sunrise treks, lake boating, waterfall canyoning, and eco-tours across Mahabaleshwar &amp; Panchgani
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[1, 2, 3].map((idx) => (
            <ExperienceCardSkeleton key={idx} />
          ))}
        </div>
      ) : !loading && error && total === 0 ? (
        <div className="p-8 text-center bg-red-50/60 rounded-3xl border border-red-100 text-red-600 text-sm max-w-md mx-auto">
          {error}. Please check backend connection.
        </div>
      ) : total > 0 ? (
        <div
          className="relative w-full h-[500px] sm:h-[520px] perspective-1300 flex items-center justify-center touch-pan-y"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-slate-200 text-[#0B0A06] flex items-center justify-center cursor-pointer z-30 shadow-md transition-all hover:bg-primary hover:text-white hover:border-primary hover:scale-110 active:scale-95"
            aria-label="Previous experience"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="relative w-full h-full preserve-3d flex items-center justify-center">
            {activities.map((item, index) => {
              let diff = (index - activeIndex) % total;
              if (diff > Math.floor(total / 2)) {
                diff -= total;
              } else if (diff < -Math.floor(total / 2)) {
                diff += total;
              }

              // GPU & Render optimization: unmount cards beyond the 5-card fan view
              if (Math.abs(diff) > 2 && total > 5) {
                return null;
              }

              const isActive = diff === 0;

              let positionClass = "fan-pos-hidden";
              if (diff === 0) positionClass = "fan-pos-active";
              else if (diff === -1) positionClass = "fan-pos-left-1";
              else if (diff === 1) positionClass = "fan-pos-right-1";
              else if (diff === -2) positionClass = "fan-pos-left-2";
              else if (diff === 2) positionClass = "fan-pos-right-2";

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  className={`absolute w-[290px] sm:w-[310px] h-[440px] sm:h-[460px] rounded-[28px] overflow-hidden cursor-pointer select-none bg-[#0B0A06] group transform-gpu ${positionClass} ${
                    isActive ? "shadow-[0_20px_45px_rgba(0,0,0,0.36)]" : "shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                  } transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`}
                  id={`fan-card-${item.id}`}
                  aria-hidden={!isActive && Math.abs(diff) > 2}
                >
                  {/* Background Image */}
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                  />

                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0A06]/95 via-[#0B0A06]/65 via-45% to-transparent pointer-events-none" />

                  {/* Card Content */}
                  <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end z-10 text-white">
                    {/* Location with Flag */}
                    <div className="inline-flex items-center gap-1.5 bg-black/45 border border-white/20 px-3 py-1 rounded-full mb-2 self-start shadow-xs">
                      <span className="text-sm">{item.flag}</span>
                      <span className="text-xs font-bold text-white tracking-wide">{item.country}</span>
                    </div>

                    {/* Heading & Details */}
                    <h3 className="text-base sm:text-lg font-bold leading-snug text-white mb-1.5 drop-shadow-md">
                      {item.title}
                    </h3>

                    {/* Active Card Expanded Info */}
                    {isActive ? (
                      <div className="animate-fadeIn">
                        <p className="text-xs text-white/85 line-clamp-2 leading-relaxed mb-2">
                          {item.description}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-white/90 font-semibold mb-3">
                          <span>⏱ {item.duration}</span>
                          <span>⭐ {item.rating}</span>
                        </div>

                        {/* Price and Book Option */}
                        <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-white/20">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-white/70">Price from</span>
                            <span className="text-sm sm:text-base font-bold text-white">{item.price}</span>
                          </div>

                          <Link
                            href={`/experiences/${item.id}`}
                            className="bg-gradient-to-r from-[#f70200] to-[#d40806] text-white rounded-full px-4 py-2 text-xs font-bold shadow-[0_4px_14px_rgba(234,17,13,0.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(234,17,13,0.45)] active:translate-y-0 transition-all whitespace-nowrap cursor-pointer text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    ) : (
                      /* Inactive Card Click Cue */
                      <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium mt-1 transition-transform group-hover:translate-x-1">
                        <span>Click to explore</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-slate-200 text-[#0B0A06] flex items-center justify-center cursor-pointer z-30 shadow-md transition-all hover:bg-primary hover:text-white hover:border-primary hover:scale-110 active:scale-95"
            aria-label="Next experience"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      ) : null}

      {/* Pagination Dots */}
      {total > 0 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {activities.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all border-none cursor-pointer p-0 ${
                idx === activeIndex ? "w-6 bg-primary" : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
              type="button"
            />
          ))}
        </div>
      )}
    </section>
  );
}
