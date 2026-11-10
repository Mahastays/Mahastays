"use client";

import { useState, memo, useMemo } from "react";
import Link from "next/link";
import { useWishlistItem } from "@/lib/wishlist";

export interface Stay {
  id: string;
  name: string;
  price: string;
  numericPrice?: number;
  inrPrice?: number;
  originalPrice?: number | string;
  rating: string | number;
  reviewsCount?: number;
  description: string;
  tags: string[];
  image: string;
  bgColor?: string;
  gradientOverlay?: string;
  type?: "Resort" | "Hotel" | "Villa" | "Package" | "Experience" | "Apartment" | "Cottage" | string;
  location?: string;
  city?: string;
  country?: string;
  amenities?: any[];
  badge?: string;
  tagline?: string;
  highlights?: any[];
  featured?: boolean;
  acceptingBookings?: boolean;
}

interface StayCardProps {
  stay: Stay;
  onBook?: (stay: Stay) => void;
}

function StayCard({ stay, onBook }: StayCardProps) {
  const { isSaved, toggle } = useWishlistItem({
    id: stay.id,
    type: "property",
    title: stay.name,
    location: stay.location,
    price: stay.price,
    numericPrice: stay.numericPrice || stay.inrPrice,
    image: stay.image,
    rating: stay.rating,
    category: stay.type,
    url: `/explore/${stay.id}`,
  });
  const [imgSrc, setImgSrc] = useState(stay.image || "/hero-resort.jpg");

  // Feature points for the reviews line (fills the blank space beside rating badge)
  const featurePoints = useMemo(() => {
    const points: string[] = [];
    const seen = new Set<string>();

    const add = (val?: string | null) => {
      if (!val) return;
      const clean = String(val).trim();
      if (!clean) return;
      if (clean.length > 25) return;
      const lower = clean.toLowerCase();
      if (seen.has(lower)) return;
      seen.add(lower);
      points.push(clean);
    };

    // 1. Explicit tags provided on stay
    if (Array.isArray(stay.tags)) {
      stay.tags.forEach((t) => add(t));
    }

    // 2. Property Badge (e.g. "Top Rated Villa", "Luxury Stay", "Best Seller")
    if (stay.badge) {
      add(stay.badge);
    }

    // 3. BHK extracted from name or description (e.g. "3 BHK", "4 BHK", "2 BHK", "Studio")
    const textSource = `${stay.name || ""} ${stay.description || ""} ${stay.tagline || ""}`;
    const bhkMatch = textSource.match(/\b([1-9]\s*BHK|Studio)\b/i);
    if (bhkMatch) {
      add(bhkMatch[0].toUpperCase());
    }

    // 4. Property Type if not already added
    if (stay.type) {
      add(stay.type);
    }

    // 5. Explicit amenities / amenityNames passed
    if (Array.isArray(stay.amenities)) {
      stay.amenities.forEach((a) => {
        if (typeof a === "string") add(a);
        else if (a && typeof a.name === "string") add(a.name);
      });
    }

    // 6. Highlights titles if passed
    if (Array.isArray(stay.highlights)) {
      stay.highlights.forEach((h) => {
        if (typeof h === "string") add(h);
        else if (h && typeof h.title === "string") add(h.title);
      });
    }

    // 7. Common popular features extracted from name or description
    const popularKeywords = [
      { pattern: /\b(private\s+pool|infinity\s+pool|swimming\s+pool|pool)\b/i, label: "Private Pool" },
      { pattern: /\b(valley\s+view|mountain\s+view|scenic\s+view)\b/i, label: "Valley View" },
      { pattern: /\b(chef\s+on\s+demand|private\s+chef|chef|home\s+cooked)\b/i, label: "Chef on Demand" },
      { pattern: /\b(lawn|garden|private\s+lawn)\b/i, label: "Garden & Lawn" },
      { pattern: /\b(bonfire|campfire)\b/i, label: "Bonfire" },
      { pattern: /\b(free\s+wifi|wifi)\b/i, label: "Free WiFi" },
      { pattern: /\b(jacuzzi|hot\s+tub)\b/i, label: "Jacuzzi" },
      { pattern: /\b(pet\s+friendly|pets\s+allowed)\b/i, label: "Pet Friendly" },
      { pattern: /\b(near\s+mapro|mapro\s+garden)\b/i, label: "Near Mapro" },
      { pattern: /\b(near\s+venna\s+lake|venna\s+lake)\b/i, label: "Near Venna Lake" },
      { pattern: /\b(ac|air\s+conditioning)\b/i, label: "AC" },
    ];

    for (const { pattern, label } of popularKeywords) {
      if (points.length >= 3) break;
      if (pattern.test(textSource)) {
        add(label);
      }
    }

    // Fallback if still empty
    if (points.length === 0) {
      if (stay.location) add(stay.location.split(",")[0].trim());
      add("Verified Stay");
    }

    return points.slice(0, 3);
  }, [stay]);

  // Original Price (cut) calculation
  const currentNumeric = stay.numericPrice || stay.inrPrice;
  const parsedOriginal =
    typeof stay.originalPrice === "number"
      ? stay.originalPrice
      : typeof stay.originalPrice === "string" && !isNaN(Number(stay.originalPrice))
      ? Number(stay.originalPrice)
      : undefined;

  const originalVal =
    parsedOriginal && parsedOriginal > (currentNumeric || 0)
      ? parsedOriginal
      : currentNumeric && currentNumeric > 0
      ? Math.round((currentNumeric * 1.25) / 100) * 100
      : undefined;

  const displayOriginalPrice =
    typeof originalVal === "number"
      ? `₹${originalVal.toLocaleString("en-IN")}`
      : typeof stay.originalPrice === "string" && stay.originalPrice.trim() !== ""
      ? stay.originalPrice
      : undefined;

  return (
    <article
      className="bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 relative group h-full border border-slate-200/90 hover:border-slate-300 w-full mx-auto"
      id={`stay-card-${stay.id}`}
    >
      {/* Top Image Container - Compact height */}
      <div className="relative w-full h-40 sm:h-44 overflow-hidden shrink-0 bg-slate-100">
        <img
          src={imgSrc}
          alt={stay.name}
          loading="lazy"
          decoding="async"
          onError={() => setImgSrc("/hero-resort.jpg")}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Subtle top dark gradient for badge readability */}
        <div className="absolute inset-x-0 top-0 h-16 pointer-events-none bg-gradient-to-b from-black/40 via-black/15 to-transparent z-1" />

        {/* Soft bottom white gradient blend into the card content */}
        <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none bg-gradient-to-t from-white via-white/70 via-35% to-transparent z-1" />

        {/* Bookmark / Save Button */}
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await toggle();
          }}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center cursor-pointer z-10 transition-all border border-black/5 ${
            isSaved
              ? "bg-[#ea110d] text-white"
              : "bg-white/90 hover:bg-white text-slate-700 hover:text-[#ea110d]"
          }`}
          aria-label={`Save ${stay.name}`}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill={isSaved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Location badge on top left */}
        {stay.location && (
          <div
            className="absolute top-2.5 left-2.5 z-10 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold text-white/95 border border-white/20 flex items-center gap-1"
            title={stay.location}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" />
              <circle cx="12" cy="9" r="3" />
            </svg>
            <span className="truncate max-w-[130px] sm:max-w-[160px]">{stay.location}</span>
          </div>
        )}

        {/* Bookings Paused pill on bottom left of image */}
        {stay.acceptingBookings === false && (
          <div className="absolute bottom-2.5 left-2.5 z-10 bg-amber-500/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold text-white border border-amber-400 tracking-wide uppercase">
            Bookings Paused
          </div>
        )}
      </div>

      {/* Content Area (Clean Light Theme, Compact padding) */}
      <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 gap-2.5 bg-white">
        <div className="space-y-1.5">
          {/* Title & Price (Original Cut + New Price) */}
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/explore/${stay.id}`}
              className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug line-clamp-1 hover:text-[#ea110d] transition-colors flex-1 min-w-0 font-poppins"
              title={stay.name}
            >
              {stay.name}
            </Link>

            <div className="flex flex-col items-end shrink-0">
              {displayOriginalPrice && (
                <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-semibold leading-tight">
                  {displayOriginalPrice}
                </span>
              )}
              <span className="bg-rose-50 text-[#ea110d] text-xs sm:text-sm font-extrabold px-2.5 py-0.5 rounded-lg whitespace-nowrap border border-rose-100 font-poppins">
                {stay.price}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[32px]">
            {stay.description}
          </p>

          {/* Rating and Reviews Row with Feature Points */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5 min-h-[22px]">
            <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold text-amber-900 shrink-0">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="#f59e0b"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>{stay.rating && Number(stay.rating) > 0 ? stay.rating : "4.8"}</span>
              <span className="text-amber-800/80 font-medium text-[9px] sm:text-[10px]">
                {stay.reviewsCount !== undefined && stay.reviewsCount > 0
                  ? `(${stay.reviewsCount} reviews)`
                  : "(Verified)"}
              </span>
            </div>

            {/* Small featured text points filling the reviews line */}
            {featurePoints.map((point) => (
              <span
                key={point}
                className="inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors font-poppins"
              >
                <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                <span className="truncate max-w-[110px]">{point}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Book Now Button (Brand Red Light Theme, Shadow-free) */}
        {stay.acceptingBookings === false ? (
          <button
            type="button"
            disabled
            className="w-full py-2 bg-slate-100 border border-slate-200 text-slate-400 text-xs font-bold rounded-xl font-poppins cursor-not-allowed text-center mt-1"
          >
            Bookings Paused
          </button>
        ) : onBook ? (
          <button
            type="button"
            onClick={() => onBook(stay)}
            className="w-full py-2 sm:py-2.5 bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors font-poppins cursor-pointer text-center mt-1"
          >
            Book now
          </button>
        ) : (
          <Link
            href={`/stay/${stay.id}`}
            className="w-full py-2 sm:py-2.5 bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors font-poppins text-center mt-1 block"
          >
            Book now
          </Link>
        )}
      </div>
    </article>
  );
}

export default memo(StayCard);
