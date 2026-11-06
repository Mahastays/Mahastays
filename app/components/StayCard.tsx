"use client";

import { useState, memo } from "react";
import Link from "next/link";
import { useWishlistItem } from "@/lib/wishlist";

export interface Stay {
  id: string;
  name: string;
  price: string;
  numericPrice?: number;
  inrPrice?: number;
  rating: string | number;
  description: string;
  tags: string[];
  image: string;
  bgColor?: string;
  gradientOverlay?: string;
  type?: "Resort" | "Hotel" | "Villa" | "Package" | "Experience" | "Apartment" | "Cottage" | string;
  location?: string;
  city?: string;
  country?: string;
  amenities?: string[];
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

  return (
    <article
      className="bg-white rounded-3xl overflow-hidden flex flex-col transition-[transform,box-shadow] duration-250 ease-out hover:-translate-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.12)] relative group h-full border border-slate-200/80 w-full max-w-[420px] mx-auto sm:mx-0 transform-gpu"
      id={`stay-card-${stay.id}`}
    >
      {/* Top Image Container */}
      <div className="relative w-full h-52 sm:h-56 overflow-hidden shrink-0 bg-slate-100">
        <img
          src={imgSrc}
          alt={stay.name}
          loading="lazy"
          decoding="async"
          onError={() => setImgSrc("/hero-resort.jpg")}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 transform-gpu"
        />

        {/* Subtle top dark gradient for badge readability */}
        <div className="absolute inset-x-0 top-0 h-20 pointer-events-none bg-gradient-to-b from-black/40 via-black/15 to-transparent z-1" />

        {/* Soft bottom white gradient blend into the card content */}
        <div className="absolute inset-x-0 bottom-0 h-20 sm:h-24 pointer-events-none bg-gradient-to-t from-white via-white/70 via-35% to-transparent z-1" />

        {/* Bookmark / Save Button */}
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await toggle();
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center cursor-pointer z-10 transition-all shadow-sm ${
            isSaved
              ? "bg-[#ea110d] text-white"
              : "bg-white/85 hover:bg-white text-slate-700 hover:text-[#ea110d]"
          }`}
          aria-label={`Save ${stay.name}`}
        >
          <svg
            width="14"
            height="14"
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
            className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white/95 border border-white/20 flex items-center gap-1 shadow-sm"
            title={stay.location}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" />
              <circle cx="12" cy="9" r="3" />
            </svg>
            <span className="truncate max-w-[140px] sm:max-w-[180px]">{stay.location}</span>
          </div>
        )}

        {/* Bookings Paused pill on bottom left of image */}
        {stay.acceptingBookings === false && (
          <div className="absolute bottom-3 left-3 z-10 bg-amber-500/95 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white border border-amber-400 shadow-xs tracking-wide uppercase">
            Bookings Paused
          </div>
        )}
      </div>

      {/* Content Area (Clean Light Theme) */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-3.5 bg-white">
        <div className="space-y-2">
          {/* Title & Price Badge */}
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/explore/${stay.id}`}
              className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug line-clamp-1 hover:text-[#ea110d] transition-colors flex-1 min-w-0 font-poppins"
              title={stay.name}
            >
              {stay.name}
            </Link>
            <span className="bg-rose-50 text-[#ea110d] text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full whitespace-nowrap border border-rose-100/90 shadow-2xs shrink-0 font-poppins">
              {stay.price}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-[13px] text-slate-500 line-clamp-2 leading-relaxed min-h-[36px]">
            {stay.description}
          </p>

          {/* Rating and Tags Row */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {stay.rating && Number(stay.rating) > 0 ? (
              <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-amber-900 shrink-0">
                <svg
                  width="12"
                  height="12"
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
                <span>{stay.rating}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-slate-500 shrink-0">
                <span>New</span>
              </div>
            )}

            {stay.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-block bg-slate-100 text-slate-700 border border-slate-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap font-poppins"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Book Now Button (Brand Red Light Theme / Disabled when Paused) */}
        {stay.acceptingBookings === false ? (
          <button
            type="button"
            disabled
            className="w-full py-2.5 sm:py-3 bg-slate-100 border border-slate-200 text-slate-400 text-xs sm:text-sm font-bold rounded-full font-poppins cursor-not-allowed text-center mt-1"
          >
            Bookings Paused
          </button>
        ) : onBook ? (
          <button
            type="button"
            onClick={() => onBook(stay)}
            className="w-full py-2.5 sm:py-3 bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs sm:text-sm font-bold rounded-full transition-all shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 font-poppins cursor-pointer text-center mt-1"
          >
            Book now
          </button>
        ) : (
          <Link
            href={`/stay/${stay.id}`}
            className="w-full py-2.5 sm:py-3 bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs sm:text-sm font-bold rounded-full transition-all shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 font-poppins text-center mt-1 block"
          >
            Book now
          </Link>
        )}
      </div>
    </article>
  );
}

export default memo(StayCard);
