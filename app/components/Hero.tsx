"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toggleFavorite as toggleWishlist, getStoredFavorites } from "@/lib/wishlist";

export interface HeroSlideItem {
  id: string;
  title: string;
  subtitle?: string;
  paragraph?: string;
  image: string;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  order?: number;
  isActive?: boolean;
}

const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: "default-slide-1",
    title: "Unwind in Stunning Resorts,",
    subtitle: "Stay in Elegant Hotels.",
    paragraph: "Handpicked luxury villas, beachfront retreats, and mountain estates across Maharashtra at exclusive member rates.",
    image: "/hero-resort.jpg",
    badge: "Curated Collection",
    ctaText: "Explore Stays",
    ctaLink: "/explore",
  },
  {
    id: "default-slide-2",
    title: "Private Pool Villas &",
    subtitle: "Serene Mountain Escapes.",
    paragraph: "Escape the city rush. Enjoy infinity pool suites, bonfire nights, and breathtaking cliffside views.",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&auto=format&fit=crop&q=80",
    badge: "Boutique Living",
    ctaText: "Discover Villas",
    ctaLink: "/explore",
  },
  {
    id: "default-slide-3",
    title: "Immersive Experiences &",
    subtitle: "Curated Holiday Packages.",
    paragraph: "All-inclusive weekend stays crafted for couples, families, and celebrations with 100% verified hosts.",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1920&auto=format&fit=crop&q=80",
    badge: "All Inclusive",
    ctaText: "View Packages",
    ctaLink: "/packages",
  },
];

interface AdOffer {
  id: string;
  name: string;
  duration: string;
  view: string;
  location: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  badgeText: string;
  badgeType: "hot" | "seller" | "new" | "limited";
  image: string;
  link: string;
}

export default function Hero() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [offers, setOffers] = useState<AdOffer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);

  // Sync favorites reactively
  useEffect(() => {
    const updateFavs = () => {
      const stored = getStoredFavorites();
      const map: Record<string, boolean> = {};
      stored.forEach((item) => {
        map[item.id] = true;
      });
      setFavorites(map);
    };
    updateFavs();
    window.addEventListener("mahastays:wishlist_changed", updateFavs);
    window.addEventListener("storage", updateFavs);
    return () => {
      window.removeEventListener("mahastays:wishlist_changed", updateFavs);
      window.removeEventListener("storage", updateFavs);
    };
  }, []);

  // Dynamic Hero Slides from Backend API
  const [slides, setSlides] = useState<HeroSlideItem[]>(DEFAULT_HERO_SLIDES);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Throttled window scroll listener to smoothly shrink hero from full width
  useEffect(() => {
    let ticking = false;
    const handleWindowScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          setIsScrolled((prev) => {
            if (!prev && currentY > 45) return true;
            if (prev && currentY < 15) return false;
            return prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };
    handleWindowScroll();
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchHeroSlides = async () => {
      try {
        const res = await api.get("/hero-slides");
        const data = res.data?.data || res.data;
        if (Array.isArray(data) && data.length > 0 && isMounted) {
          setSlides(data);
        }
      } catch {
        // Keep fallback default slides
      }
    };
    fetchHeroSlides();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamic Card Ads from Backend API (Home section offers)
  useEffect(() => {
    let isMounted = true;
    const fetchCardAds = async () => {
      try {
        const res = await api.get("/ads/active?placement=homepage&adType=card&page=/");
        const data = res.data?.data || res.data;
        if (Array.isArray(data) && data.length > 0 && isMounted) {
          const mapped: AdOffer[] = data.map((item: any, idx: number) => {
            const headline = item.creative?.headline || item.adName;
            const sub = item.creative?.subHeadline || "";
            const parts = sub.split(" · ");
            const duration = parts[0] || item.creative?.duration || "3D / 2N";
            const view = parts[1] || item.creative?.view || "Scenic View";
            const location = parts[3] || parts[parts.length - 1] || item.creative?.location || "Maharashtra, India";

            let origPrice = item.creative?.originalPrice || item.originalPrice || 18500;
            let discPrice = item.creative?.discountedPrice || item.discountedPrice || 12499;
            let discPct = item.creative?.discountPercent || item.discountPercent || 30;

            if (parts[2]) {
              const numMatches = parts[2].match(/₹?([\d,]+)/g);
              if (numMatches && numMatches.length >= 2) {
                origPrice = parseInt(numMatches[0].replace(/[₹,]/g, ""), 10);
                discPrice = parseInt(numMatches[1].replace(/[₹,]/g, ""), 10);
              } else if (numMatches && numMatches.length === 1) {
                discPrice = parseInt(numMatches[0].replace(/[₹,]/g, ""), 10);
              }
              const pctMatch = parts[2].match(/(\d+)%/);
              if (pctMatch) {
                discPct = parseInt(pctMatch[1], 10);
              }
            }

            const badgeRaw = (item.creative?.badgeText || item.badgeText || "Hot Deal").toLowerCase();
            const badgeType: "hot" | "seller" | "new" | "limited" =
              badgeRaw.includes("seller")
                ? "seller"
                : badgeRaw.includes("new")
                ? "new"
                : badgeRaw.includes("limit")
                ? "limited"
                : "hot";

            return {
              id: item.id || `card-ad-${idx}`,
              name: headline,
              duration,
              view,
              location,
              originalPrice: origPrice,
              discountedPrice: discPrice,
              discountPercent: discPct,
              badgeText: item.creative?.badgeText || item.badgeText || "Hot Deal",
              badgeType,
              image:
                item.creative?.imageUrl ||
                item.creative?.mediaUrl ||
                item.image ||
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80",
              link: item.target?.ctaLink || item.link || "/explore",
            };
          });
          setOffers(mapped);
        } else if (isMounted) {
          setOffers([]);
        }
      } catch {
        if (isMounted) setOffers([]);
      } finally {
        if (isMounted) setIsLoadingOffers(false);
      }
    };
    fetchCardAds();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-carousel transition timer (every 6 seconds, pauses on hover)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  const nextHeroSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const prevHeroSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const checkScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    const leftCan = scrollLeft > 15;
    const rightCan = scrollLeft + clientWidth < scrollWidth - 15;
    setCanScrollLeft((prev) => (prev !== leftCan ? leftCan : prev));
    setCanScrollRight((prev) => (prev !== rightCan ? rightCan : prev));
  };

  useEffect(() => {
    checkScroll();
    const node = carouselRef.current;
    if (node) {
      let ticking = false;
      const onScrollThrottled = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            checkScroll();
            ticking = false;
          });
          ticking = true;
        }
      };
      node.addEventListener("scroll", onScrollThrottled, { passive: true });
      window.addEventListener("resize", onScrollThrottled, { passive: true });
      return () => {
        node.removeEventListener("scroll", onScrollThrottled);
        window.removeEventListener("resize", onScrollThrottled);
      };
    }
  }, []);

  const slideLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -340, behavior: "smooth" });
    }
  };

  const slideRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 340, behavior: "smooth" });
    }
  };

  const toggleFavorite = async (offer: AdOffer, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist({
      id: offer.id,
      type: "property",
      title: offer.name,
      location: offer.location,
      price: `₹${offer.discountedPrice.toLocaleString("en-IN")}`,
      numericPrice: offer.discountedPrice,
      image: offer.image,
      category: "Villa / Resort",
      url: offer.link,
    });
  };

  return (
    <section
      className={`w-full transition-[padding] duration-500 ease-out mb-3 sm:mb-5 pt-0 ${
        isScrolled ? "px-2 sm:px-5 lg:px-7" : "px-0"
      }`}
    >
      {/* ─── Hero Main Background & Headline Auto Carousel (Smooth Scroll Shrink) ─── */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={`relative w-full h-[520px] sm:h-[560px] lg:h-[590px] flex flex-col justify-end transition-[border-radius,box-shadow] duration-500 ease-out ${
          isScrolled
            ? "rounded-2xl sm:rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.16)]"
            : "rounded-none shadow-none"
        }`}
      >
        {/* Layered Background Images (Crossfade Carousel) */}
        <div
          className={`absolute inset-0 overflow-hidden transition-[border-radius] duration-500 ease-out ${
            isScrolled ? "rounded-2xl sm:rounded-3xl" : "rounded-none"
          }`}
        >
          {slides.map((slide, idx) => {
            const isActive = idx === currentSlideIndex;
            return (
              <div
                key={slide.id || idx}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? "opacity-100 z-1" : "opacity-0 pointer-events-none z-0"
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className={`w-full h-full object-cover object-[center_42%] transition-transform duration-[6000ms] ease-out ${
                    isActive ? "scale-105" : "scale-100"
                  }`}
                />
              </div>
            );
          })}

          {/* Cinematic dark gradients for headline readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/15 pointer-events-none z-2" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-2" />
        </div>

        {/* Hero Headline & Subheading & Content */}
        <div className="relative z-10 px-8 sm:px-14 lg:px-20 pb-20 sm:pb-24 pt-32 sm:pt-36 transition-all duration-700">
          {slides.map((slide, idx) => {
            const isActive = idx === currentSlideIndex;
            if (!isActive) return null;
            return (
              <div
                key={slide.id || idx}
                className="max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                {slide.badge && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#ea110d] text-white mb-2.5 shadow-sm">
                    {slide.badge}
                  </span>
                )}
                <h1 className="text-2xl sm:text-4xl lg:text-[44px] font-bold text-white leading-tight tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] font-poppins">
                  {slide.title}
                  {slide.subtitle && (
                    <>
                      <br />
                      <span>{slide.subtitle}</span>
                    </>
                  )}
                </h1>
                {slide.paragraph && (
                  <p className="mt-2 text-xs sm:text-sm text-slate-200/90 max-w-lg line-clamp-2 drop-shadow-sm">
                    {slide.paragraph}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Carousel Indicators / Navigation Controls */}
        {slides.length > 1 && (
          <div className="absolute bottom-16 sm:bottom-20 right-6 sm:right-14 lg:right-20 z-10 flex items-center gap-2">
            <button
              onClick={prevHeroSlide}
              aria-label="Previous hero slide"
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white/90 flex items-center justify-center backdrop-blur-md border border-white/20 transition cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlideIndex
                      ? "w-6 bg-[#ea110d]"
                      : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextHeroSlide}
              aria-label="Next hero slide"
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white/90 flex items-center justify-center backdrop-blur-md border border-white/20 transition cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ─── Horizontal Ad / Special Offers Slider Section (Only shown if active ads exist) ─── */}
      {!isLoadingOffers && offers.length > 0 && (
        <div className="relative -mt-14 sm:-mt-18 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full animate-in fade-in duration-300">
          <div className="flex items-center gap-3 sm:gap-3.5 w-full">
            {/* Card 0: Special Offers Intro Card (Fixed on the left, White Theme) */}
            <div className="w-[150px] sm:w-[170px] h-[130px] shrink-0 rounded-2xl bg-white border border-slate-100 p-3 sm:p-3.5 flex flex-col justify-between relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] z-10 select-none">
              {/* Parasol umbrella + sun lounger + tropical palm leaves illustration */}
              <div className="absolute -right-1 -bottom-1 pointer-events-none">
                <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-22 h-18 sm:w-24 sm:h-20">
                  {/* Tropical Palm leaves */}
                  <path d="M120 100C105 85 90 85 70 95C85 80 100 80 120 100Z" fill="#15803d" opacity="0.65" />
                  <path d="M120 85C100 70 85 75 65 90C80 70 100 68 120 85Z" fill="#16a34a" opacity="0.8" />
                  <path d="M120 95C95 90 85 92 60 98C80 88 100 88 120 95Z" fill="#22c55e" opacity="0.55" />
                  {/* Umbrella Pole */}
                  <line x1="86" y1="54" x2="86" y2="96" stroke="#c28e5c" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Umbrella Canopy */}
                  <path d="M58 54C58 37 71 31 86 29C101 31 114 37 114 54C105 56 99 54 86 54C73 54 67 56 58 54Z" fill="#ef4444" opacity="0.9" />
                  <path d="M67 54C69 41 77 33 86 29C95 33 103 41 105 54C97 55 93 54 86 54C79 54 75 55 67 54Z" fill="#fca5a5" opacity="0.95" />
                  <path d="M77 54C79 43 82 35 86 29C90 35 93 43 95 54C91 54 89 54 86 54C83 54 81 54 77 54Z" fill="#ffffff" opacity="0.95" />
                  <circle cx="86" cy="28.5" r="2" fill="#b91c1c" />
                  {/* Beach Lounger Bed */}
                  <path d="M64 94L77 86L96 88L104 94" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="71" y1="94" x2="77" y2="86" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="93" y1="94" x2="93" y2="88" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M67 91L77 85L94 87" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>

              {/* Top row: % Badge and Action Arrow */}
              <div className="flex items-center justify-between relative z-10">
                <div className="w-6 h-6 rounded-full bg-[#ea110d] text-white flex items-center justify-center font-black text-xs shadow-xs">
                  %
                </div>
                <Link
                  href="/packages"
                  className="w-7 h-7 rounded-full bg-[#ea110d] hover:bg-[#d00f0c] text-white flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95"
                  aria-label="View Special Offers"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>

              {/* Title & Subtitle */}
              <div className="relative z-10">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight font-poppins">
                  Special<br />Offers
                </h3>
                <p className="text-[10px] text-slate-500 leading-tight mt-1 max-w-[105px]">
                  Exclusive stays at member rates
                </p>
              </div>
            </div>

            {/* Sliding Cards Container - ONLY HOTEL CARDS SLIDE */}
            <div className="relative flex-1 min-w-0 group/carousel">
              {/* Left Slide Button (Visible when scrolled) */}
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={slideLeft}
                  aria-label="Slide offers left"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 sm:-translate-x-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-[0_4px_18px_rgba(0,0,0,0.15)] border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-[#ea110d] hover:scale-105 active:scale-95 transition-all z-30 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Cards Horizontal Track */}
              <div
                ref={carouselRef}
                className="flex items-center gap-3 sm:gap-3.5 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth snap-x snap-mandatory"
              >
                {offers.map((offer) => {
                  const isFav = Boolean(favorites[offer.id]);
                  return (
                    <div
                      key={offer.id}
                      className="w-[310px] sm:w-[330px] h-[130px] shrink-0 bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] transition-all flex items-center gap-3 snap-start group relative"
                    >
                      {/* Left Side: Image with badges */}
                      <div className="relative w-28 sm:w-30 h-full rounded-xl overflow-hidden shrink-0 bg-slate-100">
                        <img
                          src={offer.image}
                          alt={offer.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Top-Left Category Badge */}
                        <div
                          className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 shadow-xs text-white ${
                            offer.badgeType === "seller"
                              ? "bg-[#16a34a]"
                              : offer.badgeType === "new"
                              ? "bg-[#2563eb]"
                              : offer.badgeType === "limited"
                              ? "bg-[#ea580c]"
                              : "bg-[#ea110d]"
                          }`}
                        >
                          {offer.badgeType === "hot" && (
                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                              <path d="M12 23c6.075 0 11-4.925 11-11C23 6.8 19.5 3 17 1c0 3-2 5-4 5s-3-2-3-4C7 4.5 3 8 3 12c0 6.075 4.925 11 9 11z" />
                            </svg>
                          )}
                          {offer.badgeType === "seller" && (
                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                            </svg>
                          )}
                          {offer.badgeType === "new" && (
                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          )}
                          {offer.badgeType === "limited" && (
                            <svg className="w-2.5 h-2.5 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          )}
                          <span>{offer.badgeText}</span>
                        </div>

                        {/* Top-Right Favorite Heart */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(offer, e)}
                          aria-label="Add to favorites"
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-[#ea110d] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill={isFav ? "#ea110d" : "none"}
                            stroke={isFav ? "#ea110d" : "currentColor"}
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </button>

                        {/* Bottom-Left Location Pill */}
                        <div className="absolute bottom-1.5 left-1.5 max-w-[90%] px-1.5 py-0.5 rounded-full bg-black/65 backdrop-blur-xs text-white text-[9px] font-medium flex items-center gap-1 truncate">
                          <svg className="w-2.5 h-2.5 text-white/90 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="truncate">{offer.location}</span>
                        </div>
                      </div>

                      {/* Right Side: Stay Information & Pricing */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                        <div>
                          <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 font-poppins truncate leading-snug">
                            {offer.name}
                          </h4>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
                            {offer.duration} · {offer.view}
                          </p>
                        </div>

                        <div className="pt-0.5">
                          <span className="text-[10px] text-slate-400 line-through block leading-none">
                            ₹{offer.originalPrice.toLocaleString("en-IN")}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-sm sm:text-[15px] font-extrabold text-slate-900 font-poppins leading-tight">
                              ₹{offer.discountedPrice.toLocaleString("en-IN")}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                offer.badgeType === "seller"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : offer.badgeType === "new"
                                  ? "bg-blue-50 text-blue-700"
                                  : offer.badgeType === "limited"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-rose-50 text-[#ea110d]"
                              }`}
                            >
                              {offer.discountPercent}% OFF
                            </span>
                          </div>

                          <Link
                            href={offer.link}
                            className="text-[10px] sm:text-[11px] font-bold text-slate-700 hover:text-[#ea110d] inline-flex items-center gap-1 transition-colors mt-1 group-hover:translate-x-0.5"
                          >
                            <span>View Details</span>
                            <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Slide Button (Always on right edge) */}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={slideRight}
                  aria-label="Slide offers right"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 sm:translate-x-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-[0_4px_18px_rgba(0,0,0,0.15)] border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-[#ea110d] hover:scale-105 active:scale-95 transition-all z-30 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
