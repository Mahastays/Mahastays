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
  icon: React.ReactNode;
}

const SECTIONS_CONFIG: StaySectionConfig[] = [
  {
    id: "hotels",
    categoryKey: "Hotel",
    eyebrow: "PRIME LOCATIONS & BOUTIQUE COMFORTS",
    title: "Handpicked Boutique Hotels & Suites",
    subtitle: "Centrally located boutique hotels, heritage suites, and scenic couple retreats near top viewpoints.",
    link: "/stays?type=hotel",
    linkText: "View all Hotels",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: "villas",
    categoryKey: "Villa",
    eyebrow: "EXCLUSIVE PRIVATE RETREATS",
    title: "Luxury Private Villas & Bungalows",
    subtitle: "Private pool sanctuaries, mountain-view estates, and serene family villas in Mahabaleshwar & Panchgani.",
    link: "/stays?type=villa",
    linkText: "View all Villas",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: "resorts",
    categoryKey: "Resort",
    eyebrow: "NATURE & WELLNESS GETAWAYS",
    title: "Scenic Lakeside & Hill Resorts",
    subtitle: "Lush forest escapes, expansive lawns, infinity pools, and premier hospitality amidst misty valley peaks.",
    link: "/stays?type=resort",
    linkText: "View all Resorts",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
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

  return (
    <div className="max-w-7xl mx-auto mt-6 sm:mt-10 mb-16 px-6 w-full space-y-12 sm:space-y-16" id="popular-stays">
      {/* Global error banner if fetching fails completely */}
      {!loading && error && stays.length === 0 && (
        <div className="p-6 text-center bg-red-50/70 rounded-[24px] border border-red-100 text-red-600 text-sm">
          {error}. Please make sure the backend server is running.
        </div>
      )}

      {/* 3 Dedicated Sections for Hotels, Villas, and Resorts */}
      {SECTIONS_CONFIG.map((section) => {
        const sectionStays = sectionDataMap[section.categoryKey] || [];

        return (
          <section key={section.id} id={section.id} className="w-full">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 sm:mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary block mb-1">
                  {section.eyebrow}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {section.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                  {section.subtitle}
                </p>
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
            ) : sectionStays.length > 0 ? (
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
            ) : (
              <div className="py-10 px-6 text-center bg-white rounded-[24px] sm:rounded-[26px] border border-dashed border-slate-200 shadow-xs">
                <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-red-50 flex items-center justify-center text-[#ea110d]">
                  {section.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  New {section.title} in Curation
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
                  Our concierge team is actively inspecting and certifying handpicked properties in this collection.
                </p>
                <Link
                  href="/stays"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ea110d] hover:underline cursor-pointer"
                >
                  <span>Explore All Verified Stays →</span>
                </Link>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
