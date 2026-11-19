"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import StayCard, { Stay } from "./StayCard";
import { StayCardSkeleton } from "./Skeletons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProperties } from "@/store/slices/propertyslice";

function resolvePropertyType(property: any): "Villa" | "Resort" | "Hotel" {
  const raw = String(property.type || property.propertyType || "").toLowerCase();
  const name = String(property.name || "").toLowerCase();
  const desc = String(property.description || property.shortDesc || "").toLowerCase();

  if (
    raw.includes("villa") ||
    raw.includes("bunglow") ||
    raw.includes("bungalow") ||
    name.includes("villa") ||
    name.includes("bunglow") ||
    name.includes("bungalow") ||
    desc.includes("villa") ||
    desc.includes("bungalow")
  ) {
    return "Villa";
  }

  if (
    raw.includes("resort") ||
    name.includes("resort") ||
    desc.includes("resort")
  ) {
    return "Resort";
  }

  if (
    raw.includes("hotel") ||
    raw.includes("cottage") ||
    raw.includes("apartment") ||
    raw.includes("suite") ||
    name.includes("hotel") ||
    name.includes("cottage") ||
    name.includes("suite") ||
    desc.includes("hotel") ||
    desc.includes("cottage")
  ) {
    return "Hotel";
  }

  return "Hotel";
}

interface StaySectionConfig {
  id: string;
  categoryKey: "Hotel" | "Villa" | "Resort";
  eyebrow: string;
  title: string;
  subtitle: string;
  link: string;
  linkText: string;
}

const SECTIONS_CONFIG: StaySectionConfig[] = [
  {
    id: "hotels",
    categoryKey: "Hotel",
    eyebrow: "HOTELS",
    title: "Hotels & Suites",
    subtitle: "Centrally located boutique stays and luxury suites.",
    link: "/stays?type=hotel",
    linkText: "View all Hotels",
  },
  {
    id: "villas",
    categoryKey: "Villa",
    eyebrow: "VILLAS",
    title: "Luxury Private Villas",
    subtitle: "Private pool sanctuaries and mountain-view estates.",
    link: "/stays?type=villa",
    linkText: "View all Villas",
  },
  {
    id: "resorts",
    categoryKey: "Resort",
    eyebrow: "RESORTS",
    title: "Lakeside & Hill Resorts",
    subtitle: "Scenic forest escapes and panoramic valley retreats.",
    link: "/stays?type=resort",
    linkText: "View all Resorts",
  },
];

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

  // Group stays into their respective categories
  const sectionDataMap = useMemo(() => {
    const hotels = stays.filter((s) => s.type === "Hotel");
    const villas = stays.filter((s) => s.type === "Villa");
    const resorts = stays.filter((s) => s.type === "Resort");

    return {
      Hotel: hotels,
      Villa: villas,
      Resort: resorts,
    };
  }, [stays]);

  // Identify visible sections that actually have stays
  const hasVisibleContent = useMemo(() => {
    if (loading) return true;
    return SECTIONS_CONFIG.some((sec) => (sectionDataMap[sec.categoryKey] || []).length > 0);
  }, [loading, sectionDataMap]);

  // If not loading and no stays exist in any section, do not show anything
  if (!loading && !hasVisibleContent) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto mt-6 sm:mt-10 mb-16 px-6 w-full space-y-12 sm:space-y-16" id="popular-stays">
      {/* Global error banner if fetching fails completely */}
      {!loading && error && stays.length === 0 && (
        <div className="p-6 text-center bg-red-50/70 rounded-[24px] border border-red-100 text-red-600 text-sm">
          {error}. Please make sure the backend server is running.
        </div>
      )}

      {/* Render only sections that have active stays */}
      {SECTIONS_CONFIG.map((section) => {
        const sectionStays = sectionDataMap[section.categoryKey] || [];

        // If not loading and this section has no stays, do not show this section at all
        if (!loading && sectionStays.length === 0) {
          return null;
        }

        return (
          <section key={section.id} id={section.id} className="w-full">
            {/* Short & Clean Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 sm:mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary block mb-1">
                  {section.eyebrow}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                    {section.subtitle}
                  </p>
                )}
              </div>

              <Link
                href={section.link}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#ea110d] hover:text-[#b70c09] transition-colors self-start sm:self-end shrink-0 group cursor-pointer"
                id={`view-all-${section.id}`}
              >
                <span>{section.linkText}</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Cards Grid / Carousel */}
            {loading ? (
              <div className="flex overflow-x-auto pb-4 pt-1 gap-3.5 xs:gap-4 snap-x snap-mandatory scroll-smooth no-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-4.5">
                {[1, 2, 3, 4].map((idx) => (
                  <div
                    key={idx}
                    className="min-w-[210px] xs:min-w-[230px] w-[62vw] xs:w-[58vw] max-w-[260px] sm:w-full sm:max-w-none snap-start shrink-0 sm:shrink"
                  >
                    <StayCardSkeleton />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex overflow-x-auto pb-4 pt-1 gap-3.5 xs:gap-4 snap-x snap-mandatory scroll-smooth no-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-4.5">
                {sectionStays.slice(0, 4).map((stay) => (
                  <div
                    key={stay.id}
                    className="min-w-[210px] xs:min-w-[230px] w-[62vw] xs:w-[58vw] max-w-[260px] sm:w-full sm:max-w-none snap-start shrink-0 sm:shrink"
                  >
                    <StayCard stay={stay} />
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
