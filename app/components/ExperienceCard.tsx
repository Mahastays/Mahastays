"use client";

import { useState } from "react";
import Link from "next/link";
import { useWishlistItem } from "@/lib/wishlist";

export interface ExperienceData {
  id: string;
  country: string;
  flag: string;
  title: string;
  duration: string;
  rating: string;
  price: string;
  numericPrice?: number;
  image: string;
  description: string;
  category?: string;
  city?: string;
  featured?: boolean;
  acceptingBookings?: boolean;
}

interface ExperienceCardProps {
  item: ExperienceData;
  onBook?: (item: ExperienceData) => void;
}

export default function ExperienceCard({ item, onBook }: ExperienceCardProps) {
  const { isSaved, toggle } = useWishlistItem({
    id: item.id,
    type: "experience",
    title: item.title,
    location: item.country,
    price: item.price,
    numericPrice: item.numericPrice,
    image: item.image,
    rating: item.rating,
    category: item.category || "Experience",
    url: `/experiences/${item.id}`,
  });

  return (
    <article
      className="relative w-full h-[450px] sm:h-[470px] rounded-[28px] overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.16)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_24px_50px_rgba(0,0,0,0.32)] select-none bg-[#0B0A06] group flex flex-col justify-end will-change-transform"
      id={`exp-card-${item.id}`}
    >
      {/* Background Image */}
      <img
        src={item.image}
        alt={item.title}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-106"
      />

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0A06]/95 via-[#0B0A06]/65 via-45% to-transparent pointer-events-none" />

      {/* Top Controls: Location Pin Badge & Save Button */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-rose-400 shrink-0">
              <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" />
              <circle cx="12" cy="9" r="3" />
            </svg>
            <span className="text-xs font-bold text-white tracking-wide">{item.country}</span>
          </div>
          {item.acceptingBookings === false && (
            <span className="bg-amber-500/95 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white border border-amber-400 shadow-xs uppercase tracking-wide">
              Paused
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await toggle();
          }}
          className={`w-8.5 h-8.5 rounded-full backdrop-blur-md border flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${
            isSaved
              ? "bg-primary border-primary text-white shadow-md"
              : "bg-white/25 border-white/30 text-white hover:bg-white/40"
          }`}
          aria-label={`Save ${item.title}`}
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
      </div>

      {/* Card Bottom Content */}
      <div className="relative p-5 sm:p-6 z-10 text-white flex flex-col pointer-events-auto">
        {/* Heading */}
        <Link
          href={`/experiences/${item.id}`}
          className="text-base sm:text-lg font-bold leading-snug text-white mb-2 drop-shadow-md hover:text-red-300 transition-colors block"
        >
          {item.title}
        </Link>

        {/* Description */}
        <p className="text-xs text-white/85 line-clamp-2 leading-relaxed mb-2.5">
          {item.description}
        </p>

        {/* Metadata: Duration & Rating */}
        <div className="flex items-center gap-3 text-xs text-white/90 font-semibold mb-3.5">
          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {item.duration}
          </span>
          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" strokeWidth="1">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {item.rating}
          </span>
        </div>

        {/* Price and Book Option */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 pt-3 border-t border-white/20">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-white/70">Price from</span>
            <span className="text-xs sm:text-sm md:text-base font-bold text-white tracking-tight truncate">{item.price}</span>
          </div>

          {item.acceptingBookings === false ? (
            <button
              type="button"
              disabled
              className="bg-white/20 text-white/60 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-[13px] font-bold border border-white/20 cursor-not-allowed whitespace-nowrap shrink-0"
              id={`book-exp-${item.id}`}
            >
              Bookings Paused
            </button>
          ) : onBook ? (
            <button
              type="button"
              className="bg-gradient-to-r from-[#f70200] to-[#d40806] text-white rounded-full px-4 sm:px-5 py-2 text-xs sm:text-[13px] font-bold shadow-[0_4px_14px_rgba(234,17,13,0.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(234,17,13,0.45)] active:translate-y-0 transition-all whitespace-nowrap cursor-pointer shrink-0"
              onClick={() => onBook(item)}
              id={`book-exp-${item.id}`}
            >
              Book Now
            </button>
          ) : (
            <Link
              href={`/experiences/${item.id}`}
              className="bg-gradient-to-r from-[#f70200] to-[#d40806] text-white rounded-full px-4 sm:px-5 py-2 text-xs sm:text-[13px] font-bold shadow-[0_4px_14px_rgba(234,17,13,0.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(234,17,13,0.45)] active:translate-y-0 transition-all whitespace-nowrap cursor-pointer shrink-0 block text-center"
              id={`book-exp-${item.id}`}
            >
              Book Now
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
