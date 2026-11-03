"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PackageCard, { PackageData } from "./PackageCard";
import { PackageCardSkeleton } from "./Skeletons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPackages } from "@/store/slices/packageslice";

export default function PackageSection() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.packages);
  const [activeTab, setActiveTab] = useState<string>("All");

  const categories = [
    "All",
    "Honeymoon",
    "Luxury",
    "Adventure",
    "Heritage",
  ];

  useEffect(() => {
    dispatch(fetchPackages());
  }, [dispatch]);

  // Transform backend API packages into PackageCard format
  const mappedPackages: PackageData[] = items.map((pkg) => ({
    id: pkg.id,
    badge: pkg.badge || "Verified Package",
    rating: pkg.rating || (pkg.ratingScore ? `${pkg.ratingScore}/5 ★` : "4.9/5 ★"),
    title: pkg.title || pkg.name,
    location: pkg.location,
    shortDesc: pkg.shortDesc,
    price: pkg.price || `From ₹${pkg.numericPrice?.toLocaleString("en-IN")}`,
    numericPrice: pkg.numericPrice,
    images: pkg.images && pkg.images.length > 0 ? pkg.images : [pkg.thumbnail || "/hero-resort.jpg"],
    category: pkg.category,
    city: pkg.city,
    country: pkg.country,
    durationDays: pkg.durationDays,
    featured: pkg.featured,
  }));

  const filteredPackages =
    activeTab === "All"
      ? mappedPackages
      : mappedPackages.filter((item) => {
          const cat = item.category.toLowerCase();
          const tab = activeTab.toLowerCase();
          if (tab === "honeymoon") {
            return cat.includes("honeymoon") || cat.includes("couple") || cat.includes("romantic");
          }
          return cat.includes(tab);
        });

  return (
    <section className="max-w-7xl mx-auto my-16 px-6 w-full" id="packages">
      {/* Header with Title and Eyebrow */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
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

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => {
            const isActive = activeTab === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#0B0A06] text-white border-[#0B0A06] font-semibold shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:text-primary hover:border-primary/30 hover:bg-red-50/50"
                }`}
              >
                {cat === "Honeymoon" ? "Couples & Romance" : cat}
              </button>
            );
          })}
          <Link
            href="/packages"
            className="text-xs font-bold text-primary hover:underline ml-2 hidden sm:inline-block"
          >
            View All ({mappedPackages.length}) →
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && mappedPackages.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((idx) => (
            <PackageCardSkeleton key={idx} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && mappedPackages.length === 0 && (
        <div className="p-8 text-center bg-red-50/60 rounded-3xl border border-red-100 text-red-600 text-sm">
          {error}. Please check backend connection.
        </div>
      )}

      {/* Package Cards Grid using Universal PackageCard */}
      {filteredPackages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredPackages.length === 0 && mappedPackages.length > 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          No packages found in category &quot;{activeTab}&quot;. Showing all packages instead:
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
            {mappedPackages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
