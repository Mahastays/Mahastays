"use client";

import { useState, memo } from "react";
import Link from "next/link";
import { useWishlistItem } from "@/lib/wishlist";

export interface PackageData {
  id: string;
  badge: string;
  rating: string;
  title: string;
  location: string;
  shortDesc: string;
  fullDesc?: string;
  price: string;
  numericPrice?: number;
  originalPrice?: number | string;
  images: string[];
  category: string;
  city?: string;
  country?: string;
  durationDays?: number;
  priceType?: 'per_person' | 'per_night';
  personLimit?: number;
  featured?: boolean;
  acceptingBookings?: boolean;
}

interface PackageCardProps {
  pkg: PackageData;
  onBook?: (pkg: PackageData) => void;
}

function PackageCard({ pkg, onBook }: PackageCardProps) {
  const { isSaved: isFav, toggle } = useWishlistItem({
    id: pkg.id,
    type: "package",
    title: pkg.title,
    location: pkg.location,
    price: pkg.price,
    numericPrice: pkg.numericPrice,
    image: pkg.images?.[0] || "/hero-resort.jpg",
    rating: pkg.rating,
    category: pkg.category || "Package",
    url: `/packages/${pkg.id}`,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Original Price (cut) calculation
  const currentNumeric = pkg.numericPrice;
  const parsedOriginal =
    typeof pkg.originalPrice === "number"
      ? pkg.originalPrice
      : typeof pkg.originalPrice === "string" && !isNaN(Number(pkg.originalPrice))
      ? Number(pkg.originalPrice)
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
      : typeof pkg.originalPrice === "string" && pkg.originalPrice.trim() !== ""
      ? pkg.originalPrice
      : undefined;

  return (
    <article
      className="bg-white rounded-2xl overflow-hidden flex flex-col border border-slate-200/90 hover:border-slate-300 transition-all duration-200 hover:-translate-y-1 relative group h-full w-full mx-auto"
      id={`pkg-card-${pkg.id}`}
    >
      {/* Card Image Area with Inset Radius - Compact Height */}
      <div className="relative w-[calc(100%-12px)] xs:w-[calc(100%-16px)] mx-auto mt-1.5 xs:mt-2 h-36 xs:h-40 sm:h-44 rounded-xl overflow-hidden shrink-0 bg-slate-200">
        <Link href={`/packages/${pkg.id}`} className="block w-full h-full">
          <img
            src={pkg.images[0]}
            alt={pkg.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>

        {/* Top-Left Host / Badge */}
        {pkg.badge && (
          <span className="absolute top-2 left-2 xs:top-2.5 xs:left-2.5 bg-[#0B0A06]/65 backdrop-blur-md text-white text-[9px] xs:text-[10px] sm:text-[11px] font-semibold px-2 xs:px-2.5 py-0.5 rounded-full border border-white/20 z-10 tracking-wide pointer-events-none">
            {pkg.badge}
          </span>
        )}

        {/* Top-Right: Rating Badge & Favorite Button */}
        <div className="absolute top-2 right-2 xs:top-2.5 xs:right-2.5 flex items-center gap-1 xs:gap-1.5 z-10">
          {pkg.rating && (
            <span className="bg-[#0B0A06]/65 backdrop-blur-md text-white text-[9px] xs:text-[10px] sm:text-[11px] font-semibold px-1.5 xs:px-2 py-0.5 rounded-full border border-white/20 pointer-events-none">
              {pkg.rating}
            </span>
          )}

          {/* Add to Favorites Button */}
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              await toggle();
            }}
            className={`w-6 h-6 xs:w-7 xs:h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer border ${
              isFav
                ? "bg-[#ea110d] border-[#ea110d] text-white scale-105"
                : "bg-[#0B0A06]/65 hover:bg-[#0B0A06]/90 border-white/20 text-white hover:text-rose-400"
            }`}
            aria-label={isFav ? "Saved to favorites" : "Add to favorites"}
            title={isFav ? "Saved to favorites" : "Add to favorites"}
            id={`fav-${pkg.id}`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill={isFav ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {pkg.acceptingBookings === false && (
          <span className="absolute top-9 xs:top-10 left-2 xs:left-2.5 bg-amber-500/95 backdrop-blur-md text-white text-[8px] xs:text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide px-1.5 xs:px-2 py-0.5 rounded-full border border-amber-400 z-10 pointer-events-none">
            Bookings Paused
          </span>
        )}

        {/* Bottom Center Carousel Dots */}
        <div className="absolute bottom-2 xs:bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 pointer-events-none">
          <span className="w-3 xs:w-3.5 h-1 rounded-full bg-white transition-all" />
          <span className="w-1 h-1 rounded-full bg-white/55" />
          <span className="w-1 h-1 rounded-full bg-white/55" />
        </div>
      </div>

      {/* Card Body - Compact Padding */}
      <div className="p-2.5 xs:p-3 sm:p-3.5 flex flex-col flex-1">
        {/* Title */}
        <Link
          href={`/packages/${pkg.id}`}
          className="text-xs xs:text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug mb-0.5 hover:text-primary transition-colors block line-clamp-1"
        >
          {pkg.title}
        </Link>

        {/* Location */}
        <p className="text-[10px] xs:text-[11px] sm:text-xs text-slate-500 font-normal mb-1.5 line-clamp-1">
          {pkg.location}
        </p>

        {/* Description with Read more toggle */}
        <p className="text-[11px] xs:text-xs text-slate-600 leading-relaxed mb-2 line-clamp-2">
          {isExpanded ? (pkg.fullDesc || pkg.shortDesc) : pkg.shortDesc}{" "}
          {pkg.fullDesc && pkg.fullDesc !== pkg.shortDesc && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-slate-400 font-medium hover:text-slate-900 underline underline-offset-2 ml-1 cursor-pointer transition-colors"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </p>

        {/* Bottom Row: Price with original cut on Left + Red Theme Book Now Button on Right */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2.5 border-t border-slate-100">
          {/* Price with highlight and original price cut */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {pkg.priceType === 'per_night' ? 'Per Night' : 'Total Package'}
                {pkg.priceType === 'per_night' && pkg.personLimit ? ` (Max ${pkg.personLimit})` : ''}
              </span>
              {displayOriginalPrice && (
                <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-semibold leading-tight">
                  {displayOriginalPrice}
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-black text-[#ea110d] tracking-tight truncate">
              {pkg.price}
            </div>
          </div>

          {/* Book Now Button (Red Theme, Shadow-free) */}
          {pkg.acceptingBookings === false ? (
            <button
              type="button"
              disabled
              className="px-3.5 h-8 sm:h-9 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl border border-slate-200 cursor-not-allowed whitespace-nowrap text-center flex items-center justify-center shrink-0"
              id={`book-pkg-${pkg.id}`}
            >
              Paused
            </button>
          ) : onBook ? (
            <button
              type="button"
              onClick={() => onBook(pkg)}
              className="px-4 sm:px-5 h-8 sm:h-9 bg-[#ea110d] hover:bg-[#d00f0b] text-white text-xs font-bold rounded-xl border-none cursor-pointer transition-colors whitespace-nowrap text-center flex items-center justify-center shrink-0"
              id={`book-pkg-${pkg.id}`}
            >
              Book Now
            </button>
          ) : (
            <Link
              href={`/packages/${pkg.id}`}
              className="px-4 sm:px-5 h-8 sm:h-9 bg-[#ea110d] hover:bg-[#d00f0b] text-white text-xs font-bold rounded-xl border-none cursor-pointer transition-colors whitespace-nowrap text-center flex items-center justify-center shrink-0"
              id={`book-pkg-${pkg.id}`}
            >
              Book Now
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default memo(PackageCard);
