"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import StayCard, { Stay } from "./StayCard";
import { StayCardSkeleton } from "./Skeletons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProperties } from "@/store/slices/propertyslice";

export default function PopularHotels() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.properties);

  useEffect(() => {
    dispatch(fetchProperties());
  }, [dispatch]);

  // Transform backend API properties into StayCard format
  const stays: Stay[] = useMemo(() => {
    return items.map((property) => ({
      id: property.id,
      name: property.name,
      price: property.price || (property.numericPrice ? `₹${property.numericPrice?.toLocaleString("en-IN")}` : ""),
      numericPrice: property.numericPrice,
      inrPrice: property.inrPrice || property.numericPrice,
      rating: property.rating || "",
      description: property.description || "",
      tags: property.tags || [],
      image:
        typeof property.images?.[0] === "string"
          ? property.images[0]
          : property.images?.[0]?.url || property.gallery?.[0] || "",
      type: (property.type as any) || (property.propertyType === "villa" ? "Villa" : "Resort"),
      location: property.location || "",
      city: property.city || "",
      country: property.country || "India",
      bgColor: property.bgColor || undefined,
      gradientOverlay: property.gradientOverlay || undefined,
      featured: property.featured,
    }));
  }, [items]);

  return (
    <section className="max-w-7xl mx-auto mt-6 sm:mt-8 mb-16 px-6 w-full" id="popular">
      {/* Section Header with Heading & Link to View All */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Curated Collection
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight ">
            Popular Hotels, Villas &amp; Resorts
          </h2>
        </div>

        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm hover:text-primary hover:border-primary/30 hover:bg-red-50/50 transition-all self-start sm:self-auto shrink-0 cursor-pointer"
          id="popular-view-all-link"
        >
          <span>View all</span>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="w-full">
              <StayCardSkeleton />
            </div>
          ))}
        </div>
      ) : !loading && error && stays.length === 0 ? (
        <div className="p-8 text-center bg-red-50/60 rounded-3xl border border-red-100 text-red-600 text-sm">
          {error}. Please make sure the backend server is running.
        </div>
      ) : stays.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stays.slice(0, 3).map((stay) => (
            <div key={stay.id} className="w-full">
              <StayCard stay={stay} />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 text-slate-500 text-sm">
          No stays currently available.
        </div>
      )}
    </section>
  );
}
