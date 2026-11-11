"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import StayCard, { Stay } from "./StayCard";
import { StayCardSkeleton } from "./Skeletons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProperties } from "@/store/slices/propertyslice";

const STAY_TABS: Array<{ id: "All" | "Hotel" | "Villa" | "Resort"; label: string }> = [
  { id: "All", label: "All Stays" },
  { id: "Hotel", label: "Hotels" },
  { id: "Villa", label: "Villas" },
  { id: "Resort", label: "Resorts" },
];

function resolvePropertyType(property: any): string {
  const raw = String(property.type || property.propertyType || "").toLowerCase();
  if (raw.includes("villa") || raw.includes("bunglow")) return "Villa";
  if (raw.includes("resort")) return "Resort";
  if (raw.includes("hotel")) return "Hotel";
  if (raw.includes("cottage")) return "Cottage";

  const name = String(property.name || "").toLowerCase();
  if (name.includes("villa") || name.includes("bunglow")) return "Villa";
  if (name.includes("resort")) return "Resort";
  if (name.includes("hotel")) return "Hotel";
  if (name.includes("cottage")) return "Cottage";

  return "Hotel";
}

export default function PopularHotels() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.properties);
  const [activeTab, setActiveTab] = useState<"All" | "Hotel" | "Villa" | "Resort">("All");

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
      originalPrice: property.originalPrice,
      rating: property.rating || "",
      description: property.description || "",
      tags: property.tags || [],
      image:
        typeof property.images?.[0] === "string"
          ? property.images[0]
          : property.images?.[0]?.url || property.gallery?.[0] || "",
      type: resolvePropertyType(property),
      badge: property.badge || undefined,
      tagline: property.tagline || undefined,
      reviewsCount: property.reviewsCount,
      amenities:
        property.amenities?.map((a: any) => (typeof a === "string" ? a : a.name)) ||
        (property as any).amenityNames ||
        [],
      highlights:
        property.highlights?.map((h: any) => (typeof h === "string" ? h : h.title)) ||
        [],
      location: property.location || "",
      city: property.city || "",
      country: property.country || "India",
      bgColor: property.bgColor || undefined,
      gradientOverlay: property.gradientOverlay || undefined,
      featured: property.featured,
    }));
  }, [items]);

  // Filter stays based on active tab
  const filteredStays = useMemo(() => {
    if (activeTab === "All") return stays;
    const target = activeTab.toLowerCase();
    return stays.filter((stay) => {
      const typeStr = (stay.type || "").toLowerCase();
      const nameStr = (stay.name || "").toLowerCase();
      return typeStr.includes(target) || nameStr.includes(target);
    });
  }, [stays, activeTab]);

  return (
    <section className="max-w-7xl mx-auto mt-6 sm:mt-8 mb-16 px-6 w-full" id="popular">
      {/* Section Header with Heading */}
      <div className="flex flex-col gap-1 mb-4 sm:mb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Curated Collection
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Popular Hotels, Villas &amp; Resorts
        </h2>
      </div>

      {/* Small Tab Layout (as in reference image) */}
      <div className="mb-6 sm:mb-7 border-b border-slate-200">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar -mb-px">
          {STAY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer select-none ${
                  isActive
                    ? "bg-white text-primary font-semibold border-t border-l border-r border-slate-300 rounded-t-lg -mb-px z-10 shadow-[0_-1px_2px_rgba(0,0,0,0.02)]"
                    : "text-slate-500 hover:text-slate-800 font-medium border-t border-l border-r border-transparent hover:border-slate-200/60 rounded-t-lg"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="flex overflow-x-auto pb-4 pt-1 gap-3.5 xs:gap-4 snap-x snap-mandatory scroll-smooth no-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-4.5">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="min-w-[210px] xs:min-w-[230px] w-[62vw] xs:w-[58vw] max-w-[260px] sm:w-full sm:max-w-none snap-start shrink-0 sm:shrink">
              <StayCardSkeleton />
            </div>
          ))}
        </div>
      ) : !loading && error && stays.length === 0 ? (
        <div className="p-8 text-center bg-red-50/60 rounded-2xl border border-red-100 text-red-600 text-sm">
          {error}. Please make sure the backend server is running.
        </div>
      ) : filteredStays.length > 0 ? (
        <div className="flex overflow-x-auto pb-4 pt-1 gap-3.5 xs:gap-4 snap-x snap-mandatory scroll-smooth no-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-4.5">
          {filteredStays.slice(0, 4).map((stay) => (
            <div key={stay.id} className="min-w-[210px] xs:min-w-[230px] w-[62vw] xs:w-[58vw] max-w-[260px] sm:w-full sm:max-w-none snap-start shrink-0 sm:shrink">
              <StayCard stay={stay} />
            </div>
          ))}
        </div>
      ) : stays.length > 0 ? (
        <div className="py-12 px-6 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            No {activeTab.toLowerCase()} found in this curated collection
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            We are actively expanding our catalog. Browse our luxury villas or check all properties.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("All")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            <span>← Back to All Stays</span>
          </button>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-500 text-sm">
          No stays currently available.
        </div>
      )}

      {/* Bottom View All Button */}
      {stays.length > 0 && (
        <div className="mt-8 sm:mt-10 flex justify-center">
          <Link
            href={activeTab === "All" ? "/stays" : `/stays?type=${activeTab.toLowerCase()}`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm hover:text-primary hover:border-primary/30 hover:bg-red-50/50 hover:shadow-md transition-all cursor-pointer"
            id="popular-view-all-link"
          >
            <span>View all {activeTab === "All" ? "stays" : activeTab.toLowerCase()}</span>
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
      )}
    </section>
  );
}
