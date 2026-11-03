"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PackageCard, { PackageData } from "../components/PackageCard";
import { PackageCardSkeleton } from "../components/Skeletons";
import PackagesOfferAdCarousel, { PackageOfferSlide } from "../components/PackagesOfferAdCarousel";
import NoMatchFound, { ActiveFilterItem } from "../components/NoMatchFound";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPackages } from "@/store/slices/packageslice";

const ITEMS_PER_PAGE = 6;

export default function PackagesPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.packages);

  useEffect(() => {
    dispatch(fetchPackages());
  }, [dispatch]);

  const packagesData: PackageData[] = useMemo(() => {
    return items.map((pkg) => ({
      id: pkg.id,
      badge: pkg.badge || "Verified Package",
      rating: pkg.rating || (pkg.ratingScore ? `${pkg.ratingScore}/5 ★` : "4.9/5 ★"),
      title: pkg.title || pkg.name,
      location: pkg.location,
      shortDesc: pkg.shortDesc,
      fullDesc: pkg.fullDesc || pkg.description,
      price: pkg.price || `From ₹${pkg.numericPrice?.toLocaleString("en-IN")}`,
      numericPrice: pkg.numericPrice,
      images: pkg.images && pkg.images.length > 0 ? pkg.images : [pkg.thumbnail || "/hero-resort.jpg"],
      category: pkg.category,
      city: pkg.city,
      country: pkg.country,
      durationDays: pkg.durationDays,
      featured: pkg.featured,
    }));
  }, [items]);

  // ─── Filter Sidebar State (Exact Same UI As In Explore) ────────
  const [destinationSearch, setDestinationSearch] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [maxPriceValue, setMaxPriceValue] = useState<number>(150000);
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("All");

  // ─── Top Bar & Horizontal Tag State (Exact Same UI As In Explore)
  const [selectedAmenity, setSelectedAmenity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");

  // ─── Pagination State ────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileFilterOpen]);

  const handlePackageOfferSelect = (slide: PackageOfferSlide) => {
    if (slide.filterDestination) {
      setDestinationSearch(slide.filterDestination);
    }
    if (slide.filterCategory) {
      setSelectedAmenity(slide.filterCategory);
    }
    const catalogElement = document.getElementById("packages-catalog");
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Read query parameters on mount or when URL changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      const type = params.get("type");
      const dest = params.get("destination");
      const q = params.get("search") || params.get("q");
      if (cat) setSelectedAmenity(cat);
      if (type) setSelectedPropertyType(type);
      if (dest) setDestinationSearch(dest);
      if (q) setSearchQuery(q);
    }
  }, []);

  // Reset page to 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    destinationSearch,
    checkInDate,
    checkOutDate,
    guestsCount,
    maxPriceValue,
    selectedPropertyType,
    selectedAmenity,
    searchQuery,
    sortBy,
  ]);

  // Filtered & Sorted Packages
  const filteredPackages = useMemo(() => {
    return packagesData.filter((pkg) => {
      // 1. Package Type Filter (All, Honeymoon, Adventure, Wellness, Island, Heritage, Luxury)
      if (selectedPropertyType !== "All") {
        if (!pkg.category.toLowerCase().includes(selectedPropertyType.toLowerCase())) {
          return false;
        }
      }

      // 2. Destination Search Input ("Where are you going?")
      if (destinationSearch.trim() !== "") {
        const dQuery = destinationSearch.toLowerCase().trim();
        const inCity = (pkg.city || "").toLowerCase().includes(dQuery);
        const inCountry = (pkg.country || "").toLowerCase().includes(dQuery);
        const inLocation = (pkg.location || "").toLowerCase().includes(dQuery);
        const inName = pkg.title.toLowerCase().includes(dQuery);
        if (!inCity && !inCountry && !inLocation && !inName) {
          return false;
        }
      }

      // 3. Price Range Slider (₹0 - ₹1,50,000)
      const inrPrice = pkg.numericPrice || 50000;
      if (inrPrice > maxPriceValue) {
        return false;
      }

      // 4. Horizontal Amenity / Tag Filter
      if (selectedAmenity !== "all") {
        const queryTag = selectedAmenity.toLowerCase();
        const inTitle = pkg.title.toLowerCase().includes(queryTag);
        const inDesc = (pkg.shortDesc + " " + (pkg.fullDesc || "")).toLowerCase().includes(queryTag);
        const inCat = pkg.category.toLowerCase().includes(queryTag);
        const inLoc = pkg.location.toLowerCase().includes(queryTag);
        if (!inTitle && !inDesc && !inCat && !inLoc) {
          return false;
        }
      }

      // 5. Header Search Query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = pkg.title.toLowerCase().includes(query);
        const matchesLocation = (pkg.location || "").toLowerCase().includes(query);
        const matchesDesc = (pkg.shortDesc || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesLocation && !matchesDesc) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.numericPrice || 0;
      const priceB = b.numericPrice || 0;
      if (sortBy === "price-low") return priceA - priceB;
      if (sortBy === "price-high") return priceB - priceA;
      if (sortBy === "rating") {
        const rA = parseFloat(a.rating.replace(/[^0-9.]/g, "")) || 0;
        const rB = parseFloat(b.rating.replace(/[^0-9.]/g, "")) || 0;
        return rB - rA;
      }
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [
    selectedPropertyType,
    destinationSearch,
    maxPriceValue,
    selectedAmenity,
    searchQuery,
    sortBy,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredPackages.length / ITEMS_PER_PAGE) || 1;
  const paginatedPackages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPackages.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPackages, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    const catalogElement = document.getElementById("packages-catalog");
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const hasActiveFilters =
    destinationSearch.trim() !== "" ||
    checkInDate !== "" ||
    checkOutDate !== "" ||
    guestsCount !== 2 ||
    maxPriceValue < 150000 ||
    selectedPropertyType !== "All" ||
    selectedAmenity !== "all" ||
    searchQuery.trim() !== "" ||
    sortBy !== "featured";

  const clearAllFilters = () => {
    setDestinationSearch("");
    setCheckInDate("");
    setCheckOutDate("");
    setGuestsCount(2);
    setMaxPriceValue(150000);
    setSelectedPropertyType("All");
    setSelectedAmenity("all");
    setSearchQuery("");
    setSortBy("featured");
    setCurrentPage(1);
  };

  const PACKAGE_TABS = [
    {
      id: "all",
      label: "All",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      id: "island",
      label: "Beach & Islands",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22V8" />
          <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
          <path d="M8 5c1.5 2 4 3 4 3s2.5-1 4-3" />
        </svg>
      ),
    },
    {
      id: "alpine",
      label: "Mountains & Snow",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
        </svg>
      ),
    },
    {
      id: "honeymoon",
      label: "Honeymoon",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
    {
      id: "wellness",
      label: "Wellness & Spa",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20" />
          <path d="M12 4c-3 0-5 2-5 5h10c0-3-2-5-5-5z" />
          <path d="M7 13c-2.5 0-4 1.5-4 4h18c0-2.5-1.5-4-4-4" />
          <path d="M3 21h18" />
        </svg>
      ),
    },
    {
      id: "heritage",
      label: "Royal Heritage",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 10a3 3 0 0 1 6 0v11H9V10z" />
        </svg>
      ),
    },
    {
      id: "adventure",
      label: "Wildlife & Safari",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
    {
      id: "luxury",
      label: "All-Inclusive Luxury",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
  ];

  const activeFilterItems: ActiveFilterItem[] = useMemo(() => {
    const list: ActiveFilterItem[] = [];
    if (selectedAmenity && selectedAmenity !== "all") {
      const tab = PACKAGE_TABS.find((t) => t.id === selectedAmenity);
      list.push({
        id: "category",
        label: tab?.label || selectedAmenity,
        icon: tab?.icon,
        onRemove: () => setSelectedAmenity("all"),
      });
    }
    if (destinationSearch.trim()) {
      list.push({
        id: "dest",
        label: destinationSearch.trim(),
        onRemove: () => setDestinationSearch(""),
      });
    }
    if (selectedPropertyType && selectedPropertyType !== "All") {
      list.push({
        id: "type",
        label: selectedPropertyType,
        onRemove: () => setSelectedPropertyType("All"),
      });
    }
    if (searchQuery.trim()) {
      list.push({
        id: "query",
        label: `"${searchQuery.trim()}"`,
        onRemove: () => setSearchQuery(""),
      });
    }
    if (maxPriceValue < 150000) {
      list.push({
        id: "price",
        label: `Under ₹${maxPriceValue.toLocaleString("en-IN")}`,
        onRemove: () => setMaxPriceValue(150000),
      });
    }
    return list;
  }, [selectedAmenity, destinationSearch, selectedPropertyType, searchQuery, maxPriceValue]);

  const filterControls = (
  <div className="space-y-5">
{/* 1. Destination Section */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Destination</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <input
                type="text"
                value={destinationSearch}
                onChange={(e) => setDestinationSearch(e.target.value)}
                placeholder="Where are you going?"
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition shadow-xs"
              />
              {destinationSearch && (
                <button
                  onClick={() => setDestinationSearch("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 2. Check In - Check Out Section */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Check In - Check Out</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Check In Box */}
              <div className="relative flex items-center gap-2.5 p-2.5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition cursor-pointer group">
                <div className="text-slate-700 group-hover:text-primary transition shrink-0">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 leading-tight">Check In</div>
                  <div className="text-[11px] font-medium text-slate-400 leading-tight truncate">
                    {checkInDate || "Add date"}
                  </div>
                </div>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>

              {/* Check Out Box */}
              <div className="relative flex items-center gap-2.5 p-2.5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition cursor-pointer group">
                <div className="text-slate-700 group-hover:text-primary transition shrink-0">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 leading-tight">Check Out</div>
                  <div className="text-[11px] font-medium text-slate-400 leading-tight truncate">
                    {checkOutDate || "Add date"}
                  </div>
                </div>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* 3. Guests Section */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Guests</span>
            </label>
            <div className="relative">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-xs text-xs sm:text-sm font-semibold text-slate-800 hover:border-slate-300 transition cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>{guestsCount === 1 ? "1 Guest" : `${guestsCount} Guests`}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-slate-400">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              <select
                value={guestsCount}
                onChange={(e) => setGuestsCount(Number(e.target.value))}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              >
                <option value={1}>1 Guest</option>
                <option value={2}>2 Guests</option>
                <option value={3}>3 Guests</option>
                <option value={4}>4 Guests</option>
                <option value={5}>5 Guests</option>
                <option value={6}>6+ Guests</option>
              </select>
            </div>
          </div>

          {/* 4. Price Range Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <span>Price Range</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                ₹0 - ₹{maxPriceValue.toLocaleString()}
              </span>
            </div>
            <div className="px-0.5">
              <input
                type="range"
                min={25000}
                max={150000}
                step={5000}
                value={maxPriceValue}
                onChange={(e) => setMaxPriceValue(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ea110d]"
              />
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-1">
                <span>₹0</span>
                <span>₹75,000</span>
                <span>₹1,50,000</span>
              </div>
            </div>
          </div>

          {/* 5. Property / Package Type Section */}
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Package Type</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["All", "Honeymoon", "Adventure", "Wellness", "Island", "Heritage", "Luxury"].map((type) => {
                const isActive = selectedPropertyType.toLowerCase() === type.toLowerCase();
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedPropertyType(type)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-white shadow-sm shadow-red-500/20"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
  </div>
  );

  return (
    <main className="flex flex-col min-h-screen w-full bg-slate-50 antialiased relative">
      {/* ─── Sticky/Glassmorphic Header ───────────────────────── */}
      <Navbar />

      {/* ─── Above The Hero: Special Offers & Discount Deals Carousel (Matching Image Reference) ── */}
      <PackagesOfferAdCarousel onSelectSlide={handlePackageOfferSelect} />

 

      {/* ─── Main Catalog Section (Expanded Width: max-w-[1440px]) ── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-8 sm:py-12 w-full" id="packages-catalog">
        {/* Main 2-Column Layout */}
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* ─── LEFT SIDEBAR: FILTERS CARD (EXACT MATCHING UI AS IN EXPLORE) ── */}
          {/* ─── LEFT SIDEBAR: FILTERS CARD (Desktop Only) ── */}
          <aside className="hidden lg:block w-80 xl:w-84 shrink-0 lg:sticky lg:top-24 bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5">
            {/* Header: Up-Down Arrows Icon + Filters + Clear All */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 20V4m0 0L3 8m4-4l4 4M17 4v16m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Filters</h2>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs sm:text-sm font-semibold text-slate-400 hover:text-primary transition cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {filterControls}
          </aside>

          {/* ─── RIGHT CONTENT: TOOLBAR & GRID (EXACT MATCHING UI AS IN EXPLORE) ── */}
          <div className="flex-1 min-w-0 w-full space-y-6 pt-1">
            {/* Mobile Filter Trigger Bar (Small Screens only) */}
            <div className="flex lg:hidden items-center justify-between gap-3 w-full pb-1">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-xs sm:text-sm font-bold text-slate-800 hover:border-primary active:scale-95 transition-all cursor-pointer relative"
                id="mobile-open-filters-btn"
              >
                <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 20V4m0 0L3 8m4-4l4 4M17 4v16m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>

              <div className="text-xs text-slate-500 font-medium">
                Showing <span className="text-primary font-bold">{filteredPackages.length}</span> packages
              </div>
            </div>
            {/* Top Row: Title, Result Count, Search & Sort */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  All Luxury Holiday Packages &amp; Escapes
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Showing <span className="text-primary font-bold">{filteredPackages.length}</span> handpicked tour packages for your dream getaway
                </p>
              </div>

              {/* Right: Search Input + Sort Dropdown */}
              <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
                {/* Search Bar */}
                <div className="relative flex-1 sm:flex-initial sm:w-64 md:w-72">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search packages..."
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative shrink-0">
                  <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-2xl shadow-xs text-xs sm:text-sm font-semibold text-slate-800 hover:border-slate-300 transition">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-slate-600">
                      <path d="M7 20V4m0 0L3 8m4-4l4 4M17 4v16m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-transparent pr-5 outline-none cursor-pointer text-slate-800 font-semibold"
                    >
                      <option value="featured">Featured First</option>
                      <option value="rating">Highest Rated</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Row: Horizontal Category / Amenity Tabs with Icons (Exact As in Explore) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none">
              {PACKAGE_TABS.map((tab) => {
                const isActive = selectedAmenity === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedAmenity(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-white shadow-sm shadow-red-500/20"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
                    }`}
                  >
                    <span className={isActive ? "text-white" : "text-slate-600"}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Filter Badges */}
            {hasActiveFilters && filteredPackages.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-xs font-semibold text-slate-500">Active filters:</span>
                {destinationSearch && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    Location: {destinationSearch}
                    <button onClick={() => setDestinationSearch("")} className="hover:text-primary cursor-pointer font-bold">×</button>
                  </span>
                )}
                {checkInDate && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    From: {checkInDate}
                    <button onClick={() => setCheckInDate("")} className="hover:text-primary cursor-pointer font-bold">×</button>
                  </span>
                )}
                {selectedPropertyType !== "All" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    Type: {selectedPropertyType}
                    <button onClick={() => setSelectedPropertyType("All")} className="hover:text-black cursor-pointer font-bold">×</button>
                  </span>
                )}
                {selectedAmenity !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    Theme: {PACKAGE_TABS.find(t => t.id === selectedAmenity)?.label || selectedAmenity}
                    <button onClick={() => setSelectedAmenity("all")} className="hover:text-black cursor-pointer font-bold">×</button>
                  </span>
                )}
                {maxPriceValue < 150000 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    Max: ₹{maxPriceValue.toLocaleString()}
                    <button onClick={() => setMaxPriceValue(150000)} className="hover:text-primary cursor-pointer font-bold">×</button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-primary hover:underline ml-1 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* ─── Packages Grid (Universal Package Cards, 2 Columns) ─ */}
            {loading && packagesData.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
                {[1, 2, 3, 4].map((idx) => (
                  <PackageCardSkeleton key={idx} />
                ))}
              </div>
            ) : paginatedPackages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
                {paginatedPackages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            ) : (
              /* Empty Results Fallback with Rich Graphic & Active Filters */
              <NoMatchFound
                entityName="packages"
                activeFilters={activeFilterItems}
                onResetAll={clearAllFilters}
              />
            )}

            {/* ─── Sleek Pagination Controls ───────────────────────── */}
            {totalPages > 1 && (
              <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs sm:text-sm text-slate-500 font-medium">
                  Showing <span className="text-slate-900 font-bold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>–<span className="text-slate-900 font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredPackages.length)}</span> of <span className="text-slate-900 font-bold">{filteredPackages.length}</span> curated tour packages
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-primary disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    <span>Previous</span>
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const isActive = p === currentPage;
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-9 h-9 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-primary text-white shadow-[0_2px_10px_rgba(234,17,13,0.35)] scale-105"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-primary disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Next</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Pure Black Global Footer ─────────────────────────── */}
      <Footer />
      {/* ─── Mobile Filter Modal (Bottom Sheet Dialog on small screens) ─── */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Modal Bottom Sheet */}
          <div className="relative z-10 w-full max-h-[85vh] bg-white rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 20V4m0 0L3 8m4-4l4 4M17 4v16m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-poppins">Filters</h3>
                {hasActiveFilters && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-primary font-bold">
                    Active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs font-semibold text-slate-400 hover:text-primary transition cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer text-sm font-bold"
                  aria-label="Close filters"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {filterControls}
            </div>

            {/* Modal Sticky Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3 sticky bottom-0 z-10">
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex-1 py-3 rounded-full border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-2 py-3 rounded-full bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition cursor-pointer text-center"
              >
                Show {filteredPackages.length} Packages
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
