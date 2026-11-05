"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Stay } from "./StayCard";
import { PackageData } from "./PackageCard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProperties } from "@/store/slices/propertyslice";
import { fetchPackages } from "@/store/slices/packageslice";
import { fetchExperiences } from "@/store/slices/experienceslice";

export interface ExperienceData {
  id: string;
  title: string;
  rating: string;
  description: string;
  price: string;
  numericPrice?: number;
  image: string;
  category: string;
  city: string;
  country: string;
  duration: string;
  flag: string;
}

export interface SearchLocation {
  name: string;
  city: "Mahabaleshwar" | "Panchgani";
  description: string;
  tag?: string;
}

export const POPULAR_LOCATIONS: SearchLocation[] = [
  { name: "Mahabaleshwar", city: "Mahabaleshwar", description: "Misty hill station, strawberry farms & viewpoints", tag: "Popular City" },
  { name: "Panchgani", city: "Panchgani", description: "Table Land plateau, boutique villas & valleys", tag: "Top Destination" },
  { name: "Venna Lake", city: "Mahabaleshwar", description: "Scenic boating, lakeside food stalls & rides", tag: "Hotspot" },
  { name: "Table Land", city: "Panchgani", description: "Asia's 2nd largest mountain plateau with 360° views", tag: "Must Visit" },
  { name: "Lingmala", city: "Mahabaleshwar", description: "Multi-tier waterfalls & lush forest estates", tag: "Nature" },
  { name: "Metgutad", city: "Mahabaleshwar", description: "Quiet mountain valley with luxury private villas", tag: "Quiet Retreat" },
  { name: "Tapola", city: "Mahabaleshwar", description: "Shivsagar Lake watersports, speedboats & camping", tag: "Adventure" },
  { name: "Main Market", city: "Mahabaleshwar", description: "Bustling bazaars, chana & chikki shopping", tag: "Town Center" },
  { name: "Old Kshetra", city: "Mahabaleshwar", description: "Ancient stone temples & river sources", tag: "Heritage" },
  { name: "Sydney Point", city: "Panchgani", description: "Panoramic sunset lookout over Dhom dam", tag: "Viewpoint" },
  { name: "Bhilar", city: "Panchgani", description: "India's first village of books & berry fields", tag: "Cultural" },
  { name: "Harrison's Folly", city: "Panchgani", description: "Vast windswept plateau for paragliding", tag: "Outdoor" },
];

type CategoryFilter = "all" | "villa" | "package" | "experience" | "location";

interface NavSearchProps {
  isScrolled?: boolean;
  isHomePage?: boolean;
}

export default function NavSearch({ isScrolled = false, isHomePage = false }: NavSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const dispatch = useAppDispatch();

  // Redux data from live backend
  const reduxProperties = useAppSelector((state) => state.properties?.items || []);
  const reduxPackages = useAppSelector((state) => state.packages?.items || []);
  const reduxExperiences = useAppSelector((state) => state.experiences?.items || []);

  // Fetch catalogs on interaction if not already loaded
  useEffect(() => {
    if (isOpen || isMobileModalOpen) {
      if (reduxProperties.length === 0) dispatch(fetchProperties());
      if (reduxPackages.length === 0) dispatch(fetchPackages());
      if (reduxExperiences.length === 0) dispatch(fetchExperiences());
    }
  }, [isOpen, isMobileModalOpen, reduxProperties.length, reduxPackages.length, reduxExperiences.length, dispatch]);

  // Live stays catalog from database
  const allStays: Stay[] = useMemo(() => {
    return reduxProperties.map((p) => {
      const id = p.id || p._id;
      return {
        id,
        name: p.name,
        type: (p.type as any) || (p.propertyType === "villa" ? "Villa" : "Resort"),
        location: p.location || p.city || "Mahabaleshwar",
        city: p.city || "Mahabaleshwar",
        price: p.price || `₹${(p.numericPrice || p.inrPrice || 5000).toLocaleString("en-IN")}`,
        numericPrice: p.numericPrice || p.inrPrice || 5000,
        inrPrice: p.inrPrice || p.numericPrice || 5000,
        rating: p.rating || "4.8",
        description: p.description || "",
        image:
          typeof p.images?.[0] === "string"
            ? p.images[0]
            : p.images?.[0]?.url || p.gallery?.[0] || "/hero-resort.jpg",
        tags: p.tags || ["Verified", "Luxury"],
      };
    });
  }, [reduxProperties]);

  // Live packages catalog from database
  const allPackages: PackageData[] = useMemo(() => {
    return reduxPackages.map((pkg) => ({
      id: pkg.id,
      title: pkg.title || pkg.name,
      badge: pkg.badge || "Verified Package",
      rating: pkg.rating || (pkg.ratingScore ? `${pkg.ratingScore}/5 ★` : "4.9/5 ★"),
      location: pkg.location || "Mahabaleshwar",
      shortDesc: pkg.shortDesc || "",
      price: pkg.price || `From ₹${(pkg.numericPrice || 12000).toLocaleString("en-IN")}`,
      numericPrice: pkg.numericPrice || 12000,
      images: pkg.images?.length ? pkg.images : [pkg.thumbnail || "/hero-resort.jpg"],
      category: pkg.category || "Holiday",
      city: pkg.city || "Mahabaleshwar",
      country: pkg.country || "India",
      durationDays: pkg.durationDays || 3,
    }));
  }, [reduxPackages]);

  // Live experiences catalog from database
  const allExperiences: ExperienceData[] = useMemo(() => {
    return reduxExperiences.map((exp) => ({
      id: exp.id,
      title: exp.title || exp.name,
      rating: exp.rating || (exp.ratingScore ? `${exp.ratingScore}/5 ★` : "4.8/5 ★"),
      description: exp.description || "",
      price: exp.price || `₹${(exp.numericPrice || 499).toLocaleString("en-IN")}`,
      numericPrice: exp.numericPrice || 499,
      image: exp.image || exp.gallery?.[0] || "/hero-resort.jpg",
      category: exp.category || "Adventure",
      city: exp.city || "Mahabaleshwar",
      country: exp.country || "India",
      duration: exp.duration || "2 Hours",
      flag: exp.flag || "🇮🇳",
    }));
  }, [reduxExperiences]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filtered Results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Matching Locations
    const matchedLocations = POPULAR_LOCATIONS.filter((loc) => {
      if (!q) return true;
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q) ||
        loc.description.toLowerCase().includes(q)
      );
    }).slice(0, q ? 4 : 6);

    // Matching Stays (Villas, Resorts, Hotels)
    const matchedStays = allStays.filter((stay) => {
      if (!q) return true;
      const inName = stay.name.toLowerCase().includes(q);
      const inLoc = (stay.location || "").toLowerCase().includes(q);
      const inCity = (stay.city || "").toLowerCase().includes(q);
      const inType = (stay.type || "").toLowerCase().includes(q);
      const inTags = stay.tags?.some((t: string) => t.toLowerCase().includes(q));
      return inName || inLoc || inCity || inType || inTags;
    }).slice(0, 4);

    // Matching Packages
    const matchedPackages = allPackages.filter((pkg) => {
      if (!q) return true;
      const inTitle = pkg.title.toLowerCase().includes(q);
      const inLoc = (pkg.location || "").toLowerCase().includes(q);
      const inCity = (pkg.city || "").toLowerCase().includes(q);
      const inCat = (pkg.category || "").toLowerCase().includes(q);
      const inDesc = (pkg.shortDesc || "").toLowerCase().includes(q);
      return inTitle || inLoc || inCity || inCat || inDesc;
    }).slice(0, 3);

    // Matching Experiences
    const matchedExperiences = allExperiences.filter((exp) => {
      if (!q) return true;
      const inTitle = exp.title.toLowerCase().includes(q);
      const inCity = (exp.city || "").toLowerCase().includes(q);
      const inCat = (exp.category || "").toLowerCase().includes(q);
      const inDesc = (exp.description || "").toLowerCase().includes(q);
      return inTitle || inCity || inCat || inDesc;
    }).slice(0, 3);

    return {
      locations: matchedLocations,
      stays: matchedStays,
      packages: matchedPackages,
      experiences: matchedExperiences,
      totalCount:
        matchedLocations.length +
        matchedStays.length +
        matchedPackages.length +
        matchedExperiences.length,
    };
  }, [query, allStays, allPackages, allExperiences]);

  // Flattened items for keyboard navigation
  const flatItems = useMemo(() => {
    const list: Array<{ type: string; href: string; label: string }> = [];

    if (activeCategory === "all" || activeCategory === "location") {
      results.locations.forEach((loc) => {
        list.push({
          type: "location",
          href: `/explore?destination=${encodeURIComponent(loc.name)}`,
          label: loc.name,
        });
      });
    }

    if (activeCategory === "all" || activeCategory === "villa") {
      results.stays.forEach((stay) => {
        list.push({
          type: "stay",
          href: `/explore/${stay.id}`,
          label: stay.name,
        });
      });
    }

    if (activeCategory === "all" || activeCategory === "package") {
      results.packages.forEach((pkg) => {
        list.push({
          type: "package",
          href: `/packages/${pkg.id}`,
          label: pkg.title,
        });
      });
    }

    if (activeCategory === "all" || activeCategory === "experience") {
      results.experiences.forEach((exp) => {
        list.push({
          type: "experience",
          href: `/experiences/${exp.id}`,
          label: exp.title,
        });
      });
    }

    return list;
  }, [results, activeCategory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && flatItems[activeIndex]) {
        handleSelect(flatItems[activeIndex].href);
      } else if (query.trim()) {
        handleSubmitSearch();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setIsMobileModalOpen(false);
    }
  };

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setIsMobileModalOpen(false);
    router.push(href);
  };

  const handleSubmitSearch = () => {
    if (!query.trim()) return;
    setIsOpen(false);
    setIsMobileModalOpen(false);

    if (activeCategory === "package") {
      router.push(`/packages?search=${encodeURIComponent(query.trim())}`);
    } else if (activeCategory === "experience") {
      router.push(`/experiences?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push(`/explore?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setActiveIndex(-1);
    inputRef.current?.focus();
    mobileInputRef.current?.focus();
  };

  return (
    <>
      {/* ─── Desktop Search Input Bar ───────────────────────────────── */}
      <div ref={containerRef} className="relative hidden md:block">
        <div
          className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 h-10 w-48 lg:w-64 xl:w-72 focus-within:w-64 lg:focus-within:w-80 xl:focus-within:w-96 focus-within:bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 ${
            isScrolled || !isHomePage
              ? "bg-slate-100 border border-slate-200"
              : "bg-white/85 backdrop-blur-md border border-white/60"
          }`}
        >
          <svg
            className="shrink-0 text-slate-500 transition-colors group-focus-within:text-primary"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21L16.65 16.65" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            placeholder="Search location, villa, packages..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="border-none bg-transparent outline-none text-xs sm:text-[13px] text-slate-800 placeholder-slate-500 w-full font-medium"
            id="navbar-search"
            autoComplete="off"
          />

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              title="Clear search"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* ─── Desktop Live Search Dropdown ──────────────────────────── */}
        {isOpen && (
          <div data-lenis-prevent className="absolute right-0 mt-2.5 w-[420px] lg:w-[480px] bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.14)] border border-slate-200/90 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[82vh] overflow-y-auto custom-scrollbar">
            {/* Category Filter Pills */}
            <div className="px-3.5 pb-2.5 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: "all", label: "All" },
                { id: "villa", label: "Villas & Stays" },
                { id: "package", label: "Packages" },
                { id: "experience", label: "Experiences" },
                { id: "location", label: "Locations" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id as CategoryFilter)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeCategory === tab.id
                      ? "bg-[#ea110d] text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* When query is empty: show quick destination links & categories */}
            {!query.trim() ? (
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-poppins">
                      Popular Destinations
                    </span>
                    <span className="text-[10px] text-slate-400">Panchgani &amp; Mahabaleshwar</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_LOCATIONS.slice(0, 8).map((loc) => (
                      <button
                        key={loc.name}
                        type="button"
                        onClick={() => handleSelect(`/explore?destination=${encodeURIComponent(loc.name)}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-[#ea110d] border border-slate-200/80 hover:border-red-200 text-xs font-semibold transition cursor-pointer group"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#ea110d] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{loc.name}</span>
                        {loc.tag && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white border border-slate-200/60 text-slate-500 font-normal">
                            {loc.tag}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-poppins block mb-2">
                    Quick Categories
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSelect("/explore?type=Villa")}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold border border-slate-100 transition text-left cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div>
                        <div className="leading-tight font-poppins">Private Pool Villas</div>
                        <div className="text-[10px] text-slate-400 font-normal">Standalone luxury estates</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelect("/packages?category=Honeymoon")}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold border border-slate-100 transition text-left cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>
                      <div>
                        <div className="leading-tight font-poppins">Romantic Packages</div>
                        <div className="text-[10px] text-slate-400 font-normal">All-inclusive stays &amp; dining</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelect("/experiences?category=Water+Sports")}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold border border-slate-100 transition text-left cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="leading-tight font-poppins">Boating &amp; Adventures</div>
                        <div className="text-[10px] text-slate-400 font-normal">Venna Lake, treks &amp; tours</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelect("/explore?type=Resort")}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold border border-slate-100 transition text-left cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <div className="leading-tight font-poppins">Hillside Resorts</div>
                        <div className="text-[10px] text-slate-400 font-normal">Valley views &amp; amenities</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Live Results Content */
              <div className="divide-y divide-slate-100">
                {results.totalCount === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <circle cx="11" cy="11" r="8" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21L16.65 16.65" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-800 font-poppins">No matches for &ldquo;{query}&rdquo;</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try searching by location (e.g., Panchgani, Venna Lake) or type (Villa, Package, Boating).
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 1. Matched Locations */}
                    {(activeCategory === "all" || activeCategory === "location") && results.locations.length > 0 && (
                      <div className="p-3">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-poppins px-2 mb-1.5 flex items-center justify-between">
                          <span>Locations</span>
                          <span>{results.locations.length} found</span>
                        </div>
                        <div className="space-y-1">
                          {results.locations.map((loc) => (
                            <button
                              key={loc.name}
                              type="button"
                              onClick={() => handleSelect(`/explore?destination=${encodeURIComponent(loc.name)}`)}
                              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 text-left transition cursor-pointer group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-red-50 text-[#ea110d] flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#ea110d] transition-colors truncate font-poppins">
                                    {loc.name}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium shrink-0">
                                    {loc.city}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">{loc.description}</p>
                              </div>
                              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-[#ea110d] transition-colors shrink-0">
                                View stays →
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Matched Stays / Villas */}
                    {(activeCategory === "all" || activeCategory === "villa") && results.stays.length > 0 && (
                      <div className="p-3">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-poppins px-2 mb-1.5 flex items-center justify-between">
                          <span>Villas &amp; Stays</span>
                          <span>{results.stays.length} found</span>
                        </div>
                        <div className="space-y-1">
                          {results.stays.map((stay) => (
                            <button
                              key={stay.id}
                              type="button"
                              onClick={() => handleSelect(`/explore/${stay.id}`)}
                              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 text-left transition cursor-pointer group"
                            >
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
                                <Image
                                  src={stay.image || "/hero-resort.jpg"}
                                  alt={stay.name}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#ea110d] transition-colors truncate font-poppins">
                                    {stay.name}
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-red-50 text-[#ea110d] font-bold shrink-0">
                                    {stay.type || "Villa"}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                  <span>{stay.location}</span>
                                  <span>•</span>
                                  <span className="text-amber-500 font-semibold">{stay.rating} ★</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xs font-bold text-slate-900 font-poppins">{stay.price}</div>
                                <div className="text-[10px] text-slate-400">per night</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Matched Packages */}
                    {(activeCategory === "all" || activeCategory === "package") && results.packages.length > 0 && (
                      <div className="p-3">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-poppins px-2 mb-1.5 flex items-center justify-between">
                          <span>Holiday Packages</span>
                          <span>{results.packages.length} found</span>
                        </div>
                        <div className="space-y-1">
                          {results.packages.map((pkg) => (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => handleSelect(`/packages/${pkg.id}`)}
                              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 text-left transition cursor-pointer group"
                            >
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
                                <Image
                                  src={pkg.images?.[0] || "/hero-resort.jpg"}
                                  alt={pkg.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#ea110d] transition-colors truncate font-poppins">
                                    {pkg.title}
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-50 text-purple-700 font-bold shrink-0">
                                    {pkg.category}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                  <span>{pkg.durationDays} Days</span>
                                  <span>•</span>
                                  <span>{pkg.location}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xs font-bold text-slate-900 font-poppins">{pkg.price}</div>
                                <div className="text-[10px] text-slate-400">per couple</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Matched Experiences */}
                    {(activeCategory === "all" || activeCategory === "experience") && results.experiences.length > 0 && (
                      <div className="p-3">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-poppins px-2 mb-1.5 flex items-center justify-between">
                          <span>Experiences &amp; Activities</span>
                          <span>{results.experiences.length} found</span>
                        </div>
                        <div className="space-y-1">
                          {results.experiences.map((exp) => (
                            <button
                              key={exp.id}
                              type="button"
                              onClick={() => handleSelect(`/experiences/${exp.id}`)}
                              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 text-left transition cursor-pointer group"
                            >
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
                                <Image
                                  src={exp.image || "/hero-resort.jpg"}
                                  alt={exp.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#ea110d] transition-colors truncate font-poppins">
                                    {exp.title}
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 font-bold shrink-0">
                                    {exp.category}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                  <span>{exp.city}</span>
                                  <span>•</span>
                                  <span className="text-amber-500 font-semibold">{exp.rating}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xs font-bold text-slate-900 font-poppins">{exp.price}</div>
                                <div className="text-[10px] text-slate-400">per person</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Footer Submit CTA */}
                <div className="p-3 bg-slate-50/80 flex items-center justify-between text-xs rounded-b-2xl">
                  <span className="text-slate-500 text-[11px]">
                    Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">↵ Enter</kbd> to see all
                  </span>
                  <button
                    type="button"
                    onClick={handleSubmitSearch}
                    className="font-bold text-[#ea110d] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View all matching results</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Mobile Search Trigger Button (Visible on screens < md) ─── */}
      <button
        type="button"
        onClick={() => setIsMobileModalOpen(true)}
        className="md:hidden relative p-2 text-slate-700 hover:text-[#ea110d] transition-colors rounded-full hover:bg-slate-100/70 cursor-pointer"
        aria-label="Open Search"
        title="Search stays, packages & experiences"
      >
        <svg className="w-5 h-5 text-slate-700 hover:text-[#ea110d] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21L16.65 16.65" />
        </svg>
      </button>

      {/* ─── Mobile Fullscreen Search Sheet / Modal ──────────────────── */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 z-[100] md:hidden bg-white flex flex-col animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="p-3.5 border-b border-slate-200 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileModalOpen(false)}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex-1 flex items-center gap-2 px-3.5 py-2 bg-slate-100 rounded-full border border-slate-200 focus-within:bg-white focus-within:border-[#ea110d] transition">
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21L16.65 16.65" />
              </svg>
              <input
                ref={mobileInputRef}
                type="text"
                autoFocus
                placeholder="Search location, villa, package..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitSearch();
                }}
                className="w-full bg-transparent border-none outline-none text-sm text-slate-900 placeholder-slate-400 font-medium"
              />
              {query && (
                <button type="button" onClick={clearSearch} className="p-1 text-slate-400 hover:text-slate-600">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmitSearch}
              className="px-3.5 py-2 bg-[#ea110d] text-white text-xs font-bold rounded-full shadow-xs shrink-0"
            >
              Search
            </button>
          </div>

          {/* Category Filter Pills on Mobile */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-50/50">
            {[
              { id: "all", label: "All" },
              { id: "villa", label: "Villas & Stays" },
              { id: "package", label: "Packages" },
              { id: "experience", label: "Experiences" },
              { id: "location", label: "Locations" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id as CategoryFilter)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                  activeCategory === tab.id
                    ? "bg-[#ea110d] text-white"
                    : "bg-white border border-slate-200 text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Results List on Mobile */}
          <div data-lenis-prevent className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
            {!query.trim() ? (
              <div className="space-y-4 pt-2">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-poppins block mb-2">
                    Popular Destinations
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_LOCATIONS.map((loc) => (
                      <button
                        key={loc.name}
                        type="button"
                        onClick={() => handleSelect(`/explore?destination=${encodeURIComponent(loc.name)}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold"
                      >
                        <svg className="w-3.5 h-3.5 text-[#ea110d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{loc.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-poppins block mb-2">
                    Browse Categories
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSelect("/explore?type=Villa")}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left"
                    >
                      <div className="font-bold text-slate-900 font-poppins">Private Pool Villas</div>
                      <div className="text-[10px] text-slate-500">Standalone stays</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelect("/packages")}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left"
                    >
                      <div className="font-bold text-slate-900 font-poppins">All Packages</div>
                      <div className="text-[10px] text-slate-500">Couples &amp; Groups</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelect("/experiences")}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left"
                    >
                      <div className="font-bold text-slate-900 font-poppins">Experiences</div>
                      <div className="text-[10px] text-slate-500">Activities &amp; Tours</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelect("/explore")}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left"
                    >
                      <div className="font-bold text-slate-900 font-poppins">All Stays</div>
                      <div className="text-[10px] text-slate-500">Hotels &amp; Resorts</div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Mobile Locations */}
                {(activeCategory === "all" || activeCategory === "location") && results.locations.length > 0 && (
                  <div className="py-2.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-poppins mb-1.5">
                      Locations ({results.locations.length})
                    </div>
                    {results.locations.map((loc) => (
                      <button
                        key={loc.name}
                        type="button"
                        onClick={() => handleSelect(`/explore?destination=${encodeURIComponent(loc.name)}`)}
                        className="w-full flex items-center gap-3 py-2 text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-[#ea110d] flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900 font-poppins">{loc.name}</div>
                          <div className="text-xs text-slate-400 truncate">{loc.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Mobile Stays */}
                {(activeCategory === "all" || activeCategory === "villa") && results.stays.length > 0 && (
                  <div className="py-2.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-poppins mb-1.5">
                      Villas &amp; Stays ({results.stays.length})
                    </div>
                    {results.stays.map((stay) => (
                      <button
                        key={stay.id}
                        type="button"
                        onClick={() => handleSelect(`/explore/${stay.id}`)}
                        className="w-full flex items-center gap-3 py-2 text-left"
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <Image src={stay.image || "/hero-resort.jpg"} alt={stay.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 font-poppins truncate">{stay.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">{stay.location} • {stay.type}</div>
                          <div className="text-xs font-bold text-[#ea110d] font-poppins mt-0.5">{stay.price}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Mobile Packages */}
                {(activeCategory === "all" || activeCategory === "package") && results.packages.length > 0 && (
                  <div className="py-2.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-poppins mb-1.5">
                      Packages ({results.packages.length})
                    </div>
                    {results.packages.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => handleSelect(`/packages/${pkg.id}`)}
                        className="w-full flex items-center gap-3 py-2 text-left"
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <Image src={pkg.images?.[0] || "/hero-resort.jpg"} alt={pkg.title} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 font-poppins truncate">{pkg.title}</div>
                          <div className="text-[11px] text-slate-500 truncate">{pkg.durationDays} Days • {pkg.category}</div>
                          <div className="text-xs font-bold text-[#ea110d] font-poppins mt-0.5">{pkg.price}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Mobile Experiences */}
                {(activeCategory === "all" || activeCategory === "experience") && results.experiences.length > 0 && (
                  <div className="py-2.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-poppins mb-1.5">
                      Experiences ({results.experiences.length})
                    </div>
                    {results.experiences.map((exp) => (
                      <button
                        key={exp.id}
                        type="button"
                        onClick={() => handleSelect(`/experiences/${exp.id}`)}
                        className="w-full flex items-center gap-3 py-2 text-left"
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <Image src={exp.image || "/hero-resort.jpg"} alt={exp.title} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 font-poppins truncate">{exp.title}</div>
                          <div className="text-[11px] text-slate-500 truncate">{exp.city} • {exp.category}</div>
                          <div className="text-xs font-bold text-[#ea110d] font-poppins mt-0.5">{exp.price}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.totalCount === 0 && (
                  <div className="py-12 text-center text-slate-500">
                    <p className="text-sm font-bold text-slate-800">No matches found</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching another location or keyword.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
