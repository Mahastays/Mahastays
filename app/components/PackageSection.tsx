"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import PackageCard, { PackageData } from "./PackageCard";
import { PackageCardSkeleton } from "./Skeletons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPackages } from "@/store/slices/packageslice";

export default function PackageSection() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.packages);

  useEffect(() => {
    dispatch(fetchPackages());
  }, [dispatch]);

  // Transform backend API packages into PackageCard format
  const mappedPackages: PackageData[] = useMemo(() => {
    return items.map((pkg) => ({
      id: pkg.id,
      badge: pkg.badge || "Verified Package",
      rating: pkg.rating || (pkg.ratingScore ? `${pkg.ratingScore}/5 ★` : "4.9/5 ★"),
      title: pkg.title || pkg.name,
      location: pkg.location,
      shortDesc: pkg.shortDesc,
      price: pkg.price || `From ₹${pkg.numericPrice?.toLocaleString("en-IN")}`,
      numericPrice: pkg.numericPrice,
      originalPrice: pkg.originalPrice,
      images: pkg.images && pkg.images.length > 0 ? pkg.images : [pkg.thumbnail || "/hero-resort.jpg"],
      category: pkg.category,
      city: pkg.city,
      country: pkg.country,
      durationDays: pkg.durationDays,
      featured: pkg.featured,
    }));
  }, [items]);

  // If there are no packages, hide the entire section (heading, subtitle, cards, view all)
  if (mappedPackages.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto my-16 px-6 w-full" id="packages">
      {/* Header with Title and View All */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div className="max-w-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1.5 block">
            EXCLUSIVE BUNDLES
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-slate-900 tracking-tight leading-tight mb-2">
            Featured Stay Packages
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            All-inclusive verified stays with premium hosts, private pools, and curated local itineraries.
          </p>
        </div>

        {/* View All Button */}
        <Link
          href="/packages"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm hover:text-primary hover:border-primary/30 hover:bg-red-50/50 transition-all self-start sm:self-auto shrink-0 cursor-pointer"
          id="packages-view-all-link"
        >
          <span>View all ({mappedPackages.length})</span>
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

      {/* Loading Skeleton or Packages Grid */}
      {loading ? (
        <div className="flex overflow-x-auto pb-4 pt-1 gap-3.5 xs:gap-4 snap-x snap-mandatory scroll-smooth no-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-4.5">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="min-w-[210px] xs:min-w-[230px] w-[62vw] xs:w-[58vw] max-w-[260px] sm:w-full sm:max-w-none snap-start shrink-0 sm:shrink">
              <PackageCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="flex overflow-x-auto pb-4 pt-1 gap-3.5 xs:gap-4 snap-x snap-mandatory scroll-smooth no-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-4.5">
            {mappedPackages.slice(0, 4).map((pkg) => (
              <div key={pkg.id} className="min-w-[210px] xs:min-w-[230px] w-[62vw] xs:w-[58vw] max-w-[260px] sm:w-full sm:max-w-none snap-start shrink-0 sm:shrink">
                <PackageCard pkg={pkg} />
              </div>
            ))}
          </div>

          {/* Additional mobile-friendly View All button at bottom */}
          <div className="mt-6 flex sm:hidden justify-center">
            <Link
              href="/packages"
              className="w-full text-center py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-primary transition-all"
            >
              View All Packages ({mappedPackages.length}) →
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
