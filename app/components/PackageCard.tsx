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
  images: string[];
  category: string;
  city?: string;
  country?: string;
  durationDays?: number;
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

  return (
    <article
      className="bg-white rounded-[28px] overflow-hidden flex flex-col shadow-[0_8px_28px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] border border-slate-100 transition-[transform,box-shadow] duration-250 ease-out hover:-translate-y-1.5 hover:shadow-[0_18px_40px_rgba(0,0,0,0.09)] transform-gpu group h-full"
      id={`pkg-card-${pkg.id}`}
    >
      {/* Card Image Area with Inset Radius */}
      <div className="relative w-[calc(100%-20px)] mx-auto mt-2.5 h-56 rounded-[22px] overflow-hidden shrink-0 bg-slate-200">
        <Link href={`/packages/${pkg.id}`} className="block w-full h-full">
          <img
            src={pkg.images[0]}
            alt={pkg.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 transform-gpu"
          />
        </Link>

        {/* Top-Left Host / Badge */}
        {pkg.badge && (
          <span className="absolute top-3 left-3 bg-[#0B0A06]/65 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full border border-white/20 z-10 tracking-wide pointer-events-none">
            {pkg.badge}
          </span>
        )}

        {/* Top-Right: Rating Badge & Favorite Button */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {pkg.rating && (
            <span className="bg-[#0B0A06]/65 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/20 shadow-xs pointer-events-none">
              {pkg.rating}
            </span>
          )}

          {/* Add to Favorites Button at Top Right near Review */}
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              await toggle();
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-xs border ${
              isFav
                ? "bg-[#ea110d] border-[#ea110d] text-white scale-105"
                : "bg-[#0B0A06]/65 hover:bg-[#0B0A06]/90 border-white/20 text-white hover:text-rose-400"
            }`}
            aria-label={isFav ? "Saved to favorites" : "Add to favorites"}
            title={isFav ? "Saved to favorites" : "Add to favorites"}
            id={`fav-${pkg.id}`}
          >
            <svg
              width="14"
              height="14"
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
          <span className="absolute top-12 left-3 bg-amber-500/95 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full border border-amber-400 z-10 shadow-xs pointer-events-none">
            Bookings Paused
          </span>
        )}

        {/* Bottom Center Carousel Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 pointer-events-none">
          <span className="w-4 h-1.5 rounded-full bg-white transition-all" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/55" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/55" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/55" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/55" />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Title */}
        <Link
          href={`/packages/${pkg.id}`}
          className="text-base sm:text-[17px] font-bold text-slate-900 tracking-tight leading-snug mb-0.5 hover:text-primary transition-colors block"
        >
          {pkg.title}
        </Link>

        {/* Location */}
        <p className="text-xs text-slate-500 font-normal mb-2.5">
          {pkg.location}
        </p>

        {/* Description with Read more toggle */}
        <p className="text-xs text-slate-600 leading-relaxed mb-3">
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

        {/* Bottom Row: Price Highlight on Left + Red Theme Book Now Button on Right */}
        <div className="flex items-center justify-between gap-3 mt-auto pt-3.5 border-t border-slate-100">
          {/* Price with highlight */}
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Package
            </span>
            <div className="text-base sm:text-[17px] font-black text-[#ea110d] tracking-tight truncate">
              {pkg.price}
            </div>
          </div>

          {/* Book Now Button (Red Theme) */}
          {pkg.acceptingBookings === false ? (
            <button
              type="button"
              disabled
              className="px-5 h-10 bg-slate-100 text-slate-400 text-xs sm:text-sm font-bold rounded-full border border-slate-200 cursor-not-allowed whitespace-nowrap text-center flex items-center justify-center shrink-0"
              id={`book-pkg-${pkg.id}`}
            >
              Paused
            </button>
          ) : onBook ? (
            <button
              type="button"
              onClick={() => onBook(pkg)}
              className="px-5 sm:px-6 h-10 bg-[#ea110d] hover:bg-[#d00f0b] text-white text-xs sm:text-sm font-bold rounded-full border-none cursor-pointer transition-all shadow-[0_4px_14px_rgba(234,17,13,0.3)] hover:shadow-[0_6px_20px_rgba(234,17,13,0.4)] hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap text-center flex items-center justify-center shrink-0"
              id={`book-pkg-${pkg.id}`}
            >
              Book Now
            </button>
          ) : (
            <Link
              href={`/packages/${pkg.id}`}
              className="px-5 sm:px-6 h-10 bg-[#ea110d] hover:bg-[#d00f0b] text-white text-xs sm:text-sm font-bold rounded-full border-none cursor-pointer transition-all shadow-[0_4px_14px_rgba(234,17,13,0.3)] hover:shadow-[0_6px_20px_rgba(234,17,13,0.4)] hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap text-center flex items-center justify-center shrink-0"
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
