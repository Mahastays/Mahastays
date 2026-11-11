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
    id: "maha-slide-venna-lake",
    title: "Venna Lake Serenity &",
    subtitle: "Scenic Lakeside Stays.",
    paragraph: "Experience misty morning boating, tranquil waters, and luxury lakeside resorts in the heart of Mahabaleshwar.",
    image: "/maha%20photos/Venna_Lake.webp",
    badge: "Venna Lake Haven",
    ctaText: "Explore Stays",
    ctaLink: "/explore",
  },
  {
    id: "maha-slide-lingmala",
    title: "Lingmala Waterfall Retreats &",
    subtitle: "Misty Cliff Escapes.",
    paragraph: "Wake up to cascading waterfalls, fresh valley breeze, and private infinity pool villas in the Western Ghats.",
    image: "/maha%20photos/Lingmala.webp",
    badge: "Waterfall Retreats",
    ctaText: "Discover Villas",
    ctaLink: "/explore",
  },
  {
    id: "maha-slide-pratapgad",
    title: "Historic Pratapgad Living &",
    subtitle: "Scenic Heritage Trails.",
    paragraph: "Immerse yourself in legendary Maratha history, sunset trekking, and cliffside boutique resorts around iconic forts.",
    image: "/maha%20photos/Pratapgad_Fort.webp",
    badge: "Heritage & Culture",
    ctaText: "View Packages",
    ctaLink: "/packages",
  },
  {
    id: "maha-slide-temple",
    title: "Ancient Spiritual Calm &",
    subtitle: "Mahabaleshwar Heritage.",
    paragraph: "Find peace and rejuvenation near historic sacred temples, strawberry orchards, and pristine forest estates.",
    image: "/maha%20photos/Mahabaleshwar_Temple.webp",
    badge: "Spiritual Escapes",
    ctaText: "Explore Stays",
    ctaLink: "/explore",
  },
  {
    id: "maha-slide-green-hills",
    title: "Lush Green Valleys &",
    subtitle: "Western Ghats Horizons.",
    paragraph: "Escape to rolling misty hills, strawberry farm stays, and private infinity pool villas across Mahabaleshwar.",
    image: "/maha%20photos/Green%20Hills.webp",
    badge: "Green Horizons",
    ctaText: "Explore Stays",
    ctaLink: "/explore",
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

const DEFAULT_FALLBACK_OFFERS: AdOffer[] = [
  {
    id: "home-special-offer-1",
    name: "3 BHK Villa Near Mapro Garden",
    duration: "3D / 2N",
    view: "Scenic View",
    location: "Mahabaleshwar, India",
    originalPrice: 18500,
    discountedPrice: 12499,
    discountPercent: 32,
    badgeText: "Hot Deal",
    badgeType: "hot",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80",
    link: "/explore",
  },
];

export default function Hero() {
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
        let data: any[] = [];
        try {
          // 1. Fetch active homepage ads without restrictive adType or page filter
          const res = await api.get("/ads/active?placement=homepage");
          const items = res.data?.data || res.data;
          if (Array.isArray(items) && items.length > 0) {
            data = items;
          }
        } catch {
          // Ignore and try fallback
        }

        // 2. If no ads returned with placement filter, query all active ads
        if (data.length === 0) {
          try {
            const resAll = await api.get("/ads/active");
            const allItems = resAll.data?.data || resAll.data;
            if (Array.isArray(allItems) && allItems.length > 0) {
              data = allItems.filter(
                (item: any) =>
                  !item.placement ||
                  item.placement === "homepage" ||
                  item.placement === "home" ||
                  item.placement === "all" ||
                  item.adType === "card"
              );
              if (data.length === 0) {
                data = allItems;
              }
            }
          } catch {
            // Ignore
          }
        }

        if (Array.isArray(data) && data.length > 0 && isMounted) {
          const mapped: AdOffer[] = data.map((item: any, idx: number) => {
            const headline = item.creative?.headline || item.adName || "Special Holiday Offer";
            const sub = item.creative?.subHeadline || "";
            const parts = sub.split(" · ");
            const duration = parts[0] || item.creative?.duration || "3D / 2N";
            const view = parts[1] || item.creative?.view || "Scenic View";
            const location =
              parts[3] || parts[parts.length - 1] || item.creative?.location || "Mahabaleshwar, India";

            let origPrice =
              Number(item.creative?.originalPrice) || Number(item.originalPrice) || 18500;
            let discPrice =
              Number(item.creative?.discountedPrice) || Number(item.discountedPrice) || 12499;
            let discPct =
              Number(item.creative?.discountPercent) || Number(item.discountPercent) || 0;

            if (sub) {
              const numMatches = sub.match(/₹?([\d,]+)/g);
              if (numMatches && numMatches.length >= 2) {
                const p1 = parseInt(numMatches[0].replace(/[₹,]/g, ""), 10);
                const p2 = parseInt(numMatches[1].replace(/[₹,]/g, ""), 10);
                if (!isNaN(p1) && p1 > 0) origPrice = p1;
                if (!isNaN(p2) && p2 > 0) discPrice = p2;
              } else if (numMatches && numMatches.length === 1) {
                const p1 = parseInt(numMatches[0].replace(/[₹,]/g, ""), 10);
                if (!isNaN(p1) && p1 > 0) discPrice = p1;
              }
              const pctMatch = sub.match(/(\d+)%/);
              if (pctMatch) {
                discPct = parseInt(pctMatch[1], 10);
              }
            }

            if (!discPct && origPrice > discPrice && origPrice > 0) {
              discPct = Math.round(((origPrice - discPrice) / origPrice) * 100);
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
              discountPercent: discPct || 30,
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
          // Use verified fallback so the special offers section is reliably shown
          setOffers(DEFAULT_FALLBACK_OFFERS);
        }
      } catch {
        if (isMounted) setOffers(DEFAULT_FALLBACK_OFFERS);
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

  // Scroll-driven Hero shrink animation
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Compute smooth normalized scroll progress: 0 (top of page, full background) to 1 (scrolled down >= 320px)
  const scrollProgress = Math.min(1, Math.max(0, scrollY / 320));

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
      className="w-full mb-3 sm:mb-5 pt-0 overflow-visible"
      style={{
        paddingLeft: `calc(${scrollProgress} * clamp(8px, 2.2vw, 28px))`,
        paddingRight: `calc(${scrollProgress} * clamp(8px, 2.2vw, 28px))`,
        paddingTop: `calc(${scrollProgress} * clamp(4px, 1vw, 12px))`,
        transition: "padding 0.12s cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "padding",
      }}
    >
      {/* ─── Hero Main Background & Headline Auto Carousel ─── */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative w-full h-[560px] sm:h-[620px] lg:h-[680px] xl:h-[720px] flex flex-col justify-end overflow-hidden"
        style={{
          transform: `scale(${1 - scrollProgress * 0.04})`,
          transformOrigin: "center top",
          borderRadius: `calc(${scrollProgress} * clamp(16px, 2.5vw, 32px))`,
          boxShadow:
            scrollProgress > 0.05
              ? `0 ${scrollProgress * 22}px ${scrollProgress * 50}px -10px rgba(0,0,0,${scrollProgress * 0.22})`
              : "none",
          transition:
            "transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.12s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.12s ease-out",
          willChange: "transform, border-radius",
        }}
      >
        {/* Layered Background Images (Crossfade Carousel) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            borderRadius: `calc(${scrollProgress} * clamp(16px, 2.5vw, 32px))`,
            transition: "border-radius 0.12s cubic-bezier(0.16, 1, 0.3, 1)",
            willChange: "border-radius",
          }}
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
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.includes(".webp")) {
                      target.src = target.src.replace(".webp", ".png");
                    }
                  }}
                  className={`w-full h-full object-cover object-[center_42%] transition-transform duration-[6000ms] ease-out transform-gpu ${
                    isActive ? "scale-105" : "scale-100"
                  }`}
                />
              </div>
            );
          })}

          {/* Cinematic dark gradients for headline readability & top navbar contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-transparent pointer-events-none z-2" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/15 pointer-events-none z-2" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none z-2" />
        </div>

        {/* Hero Headline & Subheading & Content */}
        <div className="relative z-10 px-6 sm:px-12 lg:px-20 pb-20 sm:pb-24 pt-32 sm:pt-36 transition-all duration-700">
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
          <div className="absolute bottom-16 sm:bottom-20 right-6 sm:right-14 lg:right-20 z-10 flex items-center">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15">
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
          </div>
        )}
      </div>

      {/* ─── Horizontal Ad / Special Offers Slider Section (Only shown if active ads exist) ─── */}
      {!isLoadingOffers && offers.length > 0 && (
        <div className="relative -mt-14 sm:-mt-18 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full animate-in fade-in duration-300">
          <div className="flex items-center gap-2 sm:gap-3.5 w-full">
            {/* Card 0: Special Offers Intro Card (Fixed on the left, White Theme) */}
            <div className="w-[110px] min-[400px]:w-[124px] sm:w-[170px] h-[116px] sm:h-[130px] shrink-0 rounded-2xl bg-white border border-slate-100 p-2.5 sm:p-3.5 flex flex-col justify-between relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] z-10 select-none">
              {/* Parasol umbrella + sun lounger + tropical palm leaves illustration */}
              <div className="absolute -right-1 -bottom-1 pointer-events-none">
                <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-13 min-[400px]:w-18 min-[400px]:h-15 sm:w-24 sm:h-20">
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
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#ea110d] text-white flex items-center justify-center font-black text-[10px] sm:text-xs shadow-xs">
                  %
                </div>
                <Link
                  href="/packages"
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#ea110d] hover:bg-[#d00f0c] text-white flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95"
                  aria-label="View Special Offers"
                >
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>

              {/* Title & Subtitle */}
              <div className="relative z-10">
                <h3 className="font-extrabold text-slate-900 text-xs min-[400px]:text-sm sm:text-base leading-tight font-poppins">
                  Special<br />Offers
                </h3>
                <p className="text-[8.5px] min-[400px]:text-[9.5px] sm:text-[10px] text-slate-500 leading-tight mt-0.5 sm:mt-1 max-w-[76px] min-[400px]:max-w-[85px] sm:max-w-[105px] line-clamp-2">
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
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 sm:-translate-x-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-[0_4px_18px_rgba(0,0,0,0.15)] border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-[#ea110d] hover:scale-105 active:scale-95 transition-all z-30 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Cards Horizontal Track */}
              <div
                ref={carouselRef}
                className="flex items-center gap-2 sm:gap-3.5 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth snap-x snap-mandatory"
              >
                {offers.map((offer) => {
                  const isFav = Boolean(favorites[offer.id]);
                  return (
                    <div
                      key={offer.id}
                      className="w-[255px] min-[400px]:w-[280px] sm:w-[330px] h-[116px] sm:h-[130px] shrink-0 bg-white rounded-2xl p-2 sm:p-3 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] transition-[transform,box-shadow] duration-200 ease-out transform-gpu hover:-translate-y-0.5 flex items-center gap-2.5 sm:gap-3 snap-start group relative"
                    >
                      {/* Left Side: Image with badges */}
                      <div className="relative w-24 min-[400px]:w-26 sm:w-30 h-full rounded-xl overflow-hidden shrink-0 bg-slate-100">
                        <img
                          src={offer.image}
                          alt={offer.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out transform-gpu"
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
                          <h4 className="text-[11px] sm:text-[13px] font-bold text-slate-900 font-poppins truncate leading-snug">
                            {offer.name}
                          </h4>
                          <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
                            {offer.duration} · {offer.view}
                          </p>
                        </div>

                        <div className="pt-0.5">
                          <span className="text-[9px] sm:text-[10px] text-slate-400 line-through block leading-none">
                            ₹{offer.originalPrice.toLocaleString("en-IN")}
                          </span>
                          <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5">
                            <span className="text-xs min-[400px]:text-sm sm:text-[15px] font-extrabold text-slate-900 font-poppins leading-tight">
                              ₹{offer.discountedPrice.toLocaleString("en-IN")}
                            </span>
                            <span
                              className={`text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded ${
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
                            className="text-[9px] sm:text-[11px] font-bold text-slate-700 hover:text-[#ea110d] inline-flex items-center gap-1 transition-colors mt-0.5 sm:mt-1 group-hover:translate-x-0.5"
                          >
                            <span>View Details</span>
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
