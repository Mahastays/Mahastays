"use client";

import { useState, useEffect, useMemo } from "react";
import ExperienceCard from "../components/ExperienceCard";
import { ExperienceCardSkeleton } from "../components/Skeletons";
import ExperiencesOfferAdCarousel, { ExperienceOfferSlide } from "../components/ExperiencesOfferAdCarousel";
import NoMatchFound, { ActiveFilterItem } from "../components/NoMatchFound";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchExperiences } from "@/store/slices/experienceslice";

const ITEMS_PER_PAGE = 6;

export default function ExperiencesPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.experiences);

  useEffect(() => {
    dispatch(fetchExperiences());
  }, [dispatch]);

  const experiencesData = useMemo(() => {
    return items.map((exp) => {
      const displayLocation =
        (exp as any).location ||
        (exp.city && exp.city.toLowerCase() !== "india" ? exp.city : null) ||
        exp.meetingPoint?.split(",")[0]?.trim() ||
        (exp.country && exp.country.toLowerCase() !== "india" ? exp.country : "Mahabaleshwar");
      return {
        id: exp.id,
        _id: exp._id,
        title: exp.title || exp.name,
        name: exp.name || exp.title,
        country: displayLocation,
        location: displayLocation,
        flag: exp.flag || "📍",
        city: exp.city || "Mahabaleshwar",
        meetingPoint: exp.meetingPoint,
        locationId: exp.locationId,
        duration: exp.duration,
        category: exp.category,
        rating: exp.ratingScore && exp.ratingScore > 0 ? `${exp.ratingScore.toFixed(1)}/5 ★` : (exp.rating && !exp.rating.includes("4.9/5") ? exp.rating : "New"),
        ratingScore: exp.ratingScore,
        reviewsCount: exp.reviewsCount,
        price: exp.price || `₹${exp.numericPrice?.toLocaleString("en-IN")}`,
        numericPrice: exp.numericPrice,
        originalPrice: exp.originalPrice,
        priceType: exp.priceType,
        personLimit: exp.personLimit,
        difficulty: (exp.difficulty as any) || "Moderate",
        ageLimit: exp.ageLimit || "10 - 65 yrs",
        groupSize: exp.groupSize || "Small group",
        language: exp.language || "English, Hindi, Marathi",
        image: exp.image || exp.gallery?.[0] || "/hero-resort.jpg",
        description: exp.description,
        featured: exp.featured,
        acceptingBookings: (exp as any).acceptingBookings !== false,
      };
    });
  }, [items]);

  // ─── Filter Sidebar State (Exact Same UI As In Explore) ────────
  const [destinationSearch, setDestinationSearch] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [maxPriceValue, setMaxPriceValue] = useState<number>(25000);
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("All");

  // ─── Top Bar & Horizontal Tag State (Exact Same UI As In Explore)
  const [selectedAmenity, setSelectedAmenity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");

  // ─── Pagination State ────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [hasAds, setHasAds] = useState<boolean>(false);

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

  const handleExperienceOfferSelect = (slide: ExperienceOfferSlide) => {
    if (slide.filterDestination) {
      setDestinationSearch(slide.filterDestination);
    }
    if (slide.filterCategory) {
      setSelectedPropertyType(slide.filterCategory);
    }
    const catalogElement = document.getElementById("experiences-catalog");
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
      if (cat) setSelectedPropertyType(cat);
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

  // Filtered & Sorted Experiences
  const filteredExperiences = useMemo(() => {
    return experiencesData.filter((exp) => {
      // 1. Activity Type Filter
      if (selectedPropertyType !== "All") {
        const cat = (exp.category || "").toLowerCase();
        const propType = selectedPropertyType.toLowerCase();
        const words = propType.split(/[&,/\s]+/).filter((w) => w.length > 2);
        const matchesType =
          cat.includes(propType) ||
          words.some((w) => cat.includes(w) || (exp.title || "").toLowerCase().includes(w));
        if (!matchesType) {
          return false;
        }
      }

      // 2. Destination Search Input ("Where are you going?")
      if (destinationSearch.trim() !== "") {
        const dQuery = destinationSearch.toLowerCase().trim();
        const inCity = (exp.city || "").toLowerCase().includes(dQuery);
        const inCountry = (exp.country || "").toLowerCase().includes(dQuery);
        const inTitle = (exp.title || "").toLowerCase().includes(dQuery);
        if (!inCity && !inCountry && !inTitle) {
          return false;
        }
      }

      // 3. Price Range Slider (₹0 - ₹25,000)
      const inrPrice = exp.numericPrice || 5000;
      if (inrPrice > maxPriceValue) {
        return false;
      }

      // 4. Horizontal Amenity / Category Filter
      if (selectedAmenity !== "all") {
        const keywordsMap: Record<string, string[]> = {
          fun: ['fun', 'resort games', 'games', 'indoor', 'lawn'],
          karaoke: ['karaoke', 'night', 'entertainment', 'music', 'dj', 'singing'],
          bonfire: ['bonfire', 'bonefire', 'fire', 'campfire', 'music', 'bbq'],
          treasure: ['treasure', 'hunt', 'quest', 'clue'],
          games: ['group games', 'team building', 'team', 'game'],
          tower: ['tower', 'tower building', 'stack', 'blocks'],
          musical: ['musical chair', 'chair', 'party games'],
          balloon: ['balloon', 'couple balloon', 'couple', 'partner'],
          antakshari: ['antakshari', 'antrakhri', 'musical games', 'songs'],
          tambola: ['tambola', 'housie', 'bingo', 'ticket'],
          trekking: ['trek', 'hiking', 'mountain', 'trail', 'climb', 'walk', 'peak'],
          water: ['water', 'boating', 'lake', 'scuba', 'cruise', 'river', 'kayak', 'paddle', 'venna'],
          camping: ['camping', 'stargazing', 'camp', 'tent', 'night sky'],
          cycling: ['cycling', 'biking', 'bicycle', 'cycle'],
          culture: ['culture', 'heritage', 'farm', 'strawberry', 'food', 'walk', 'tour'],
        };
        const terms = keywordsMap[selectedAmenity] || [selectedAmenity.toLowerCase()];
        const combined = `${exp.title || ''} ${exp.description || ''} ${exp.category || ''} ${exp.city || ''}`.toLowerCase();
        const matchesAny = terms.some((term) => combined.includes(term));
        if (!matchesAny) {
          return false;
        }
      }

      // 5. Header Search Query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = (exp.title || "").toLowerCase().includes(query);
        const matchesCity = (exp.city || "").toLowerCase().includes(query);
        const matchesCountry = (exp.country || "").toLowerCase().includes(query);
        const matchesDesc = (exp.description || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesCity && !matchesCountry && !matchesDesc) {
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
  const totalPages = Math.ceil(filteredExperiences.length / ITEMS_PER_PAGE) || 1;
  const paginatedExperiences = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExperiences.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredExperiences, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    const catalogElement = document.getElementById("experiences-catalog");
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const hasActiveFilters =
    destinationSearch.trim() !== "" ||
    checkInDate !== "" ||
    checkOutDate !== "" ||
    guestsCount !== 2 ||
    maxPriceValue < 25000 ||
    selectedPropertyType !== "All" ||
    selectedAmenity !== "all" ||
    searchQuery.trim() !== "" ||
    sortBy !== "featured";

  const clearAllFilters = () => {
    setDestinationSearch("");
    setCheckInDate("");
    setCheckOutDate("");
    setGuestsCount(2);
    setMaxPriceValue(25000);
    setSelectedPropertyType("All");
    setSelectedAmenity("all");
    setSearchQuery("");
    setSortBy("featured");
    setCurrentPage(1);
  };

  const EXPERIENCE_TABS = [
    {
      id: "all",
      label: "All Activities",
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
      id: "fun",
      label: "Fun & Resort Games",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      ),
    },
    {
      id: "karaoke",
      label: "Night Karaoke & Entertainment",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      ),
    },
    {
      id: "bonfire",
      label: "Bonfire & Music",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      ),
    },
    {
      id: "treasure",
      label: "Treasure Hunt",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
    {
      id: "games",
      label: "Group Games & Team",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" />
          <rect width="20" height="12" x="2" y="6" rx="6" />
        </svg>
      ),
    },
    {
      id: "tower",
      label: "Tower Building",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="16" width="16" height="5" rx="1" />
          <rect x="6" y="10" width="12" height="5" rx="1" />
          <rect x="8" y="4" width="8" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: "musical",
      label: "Musical Chair",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
          <path d="M3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />
          <path d="M6 18v3" />
          <path d="M18 18v3" />
        </svg>
      ),
    },
    {
      id: "balloon",
      label: "Couple Balloon Games",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
    {
      id: "antakshari",
      label: "Antakshari",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      ),
    },
    {
      id: "tambola",
      label: "Tambola & Housie",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
        </svg>
      ),
    },
    {
      id: "trekking",
      label: "Trekking & Hiking",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
        </svg>
      ),
    },
    {
      id: "water",
      label: "Watersports & Boating",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 17c.6.5 1.2 1 2.5 1s2.5-1 3.5-1 2 .5 3 1 2.5-1 3.5-1 2 .5 3 1 2.5-1 3.5-1" />
          <path d="M2 12c.6.5 1.2 1 2.5 1s2.5-1 3.5-1 2 .5 3 1 2.5-1 3.5-1 2 .5 3 1 2.5-1 3.5-1" />
        </svg>
      ),
    },
    {
      id: "camping",
      label: "Stargazing & Camping",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 21 8-14 8 14H4z" />
          <path d="M12 7v14" />
        </svg>
      ),
    },
    {
      id: "cycling",
      label: "Cycling & Mountain Biking",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5.5" cy="17.5" r="3.5" />
          <circle cx="18.5" cy="17.5" r="3.5" />
          <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 6H5" />
          <path d="M12 17.5V14l4-3 3 2.5" />
        </svg>
      ),
    },
    {
      id: "culture",
      label: "Heritage & Strawberry Tour",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        </svg>
      ),
    },
  ];

  const activeFilterItems: ActiveFilterItem[] = useMemo(() => {
    const list: ActiveFilterItem[] = [];
    if (selectedAmenity && selectedAmenity !== "all") {
      const tab = EXPERIENCE_TABS.find((t) => t.id === selectedAmenity);
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
    if (maxPriceValue < 25000) {
      list.push({
        id: "price",
        label: `Under ₹${maxPriceValue.toLocaleString("en-IN")}`,
        onRemove: () => setMaxPriceValue(25000),
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
                min={2000}
                max={25000}
                step={500}
                value={maxPriceValue}
                onChange={(e) => setMaxPriceValue(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ea110d]"
              />
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-1">
                <span>₹0</span>
                <span>₹12,500</span>
                <span>₹25,000</span>
              </div>
            </div>
          </div>

          {/* 5. Property / Activity Type Section */}
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Activity Type</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                "All",
                "Fun Activity & Resort Games",
                "Night Karaoke & Entertainment",
                "Bonfire & Music",
                "Treasure Hunt",
                "Group Games & Team Building",
                "Tower Building",
                "Musical Chair",
                "Couple Balloon Games",
                "Antakshari & Musical Games",
                "Tambola & Housie",
                "Trekking & Hiking",
                "Watersports & Boating",
                "Stargazing & Camping",
                "Cycling & Mountain Biking",
                "Cultural & Heritage Walk",
                "Strawberry Farm Tour",
                "Adventure & Wildlife Safari",
              ].map((type) => {
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
      {/* ─── Above The Hero: Escape to Extraordinary Ad Banner Carousel (Matching Reference) ── */}
      <ExperiencesOfferAdCarousel onSelectSlide={handleExperienceOfferSelect} onAdsLoaded={setHasAds} />

      {/* ─── Main Catalog Section (Expanded Width: max-w-[1440px]) ── */}
      <section className={`max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 w-full transition-all ${hasAds ? "py-4 sm:py-8" : "pt-12 sm:pt-16 pb-8"}`} id="experiences-catalog">
        {/* Main 2-Column Layout */}
        <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
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

          {/* ─── RIGHT CONTENT: TOOLBAR & GRID ── */}
          <div className="flex-1 min-w-0 w-full space-y-3 sm:space-y-4 pt-0">
            {/* ─── Mobile Unified Action Bar (Search + Filter + Sort in ONE compact row) ─── */}
            <div className="flex lg:hidden items-center gap-2 w-full">
              {/* Search Bar on Mobile */}
              <div className="relative flex-1 min-w-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search experiences..."
                  className="w-full pl-8 pr-2.5 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-xs font-bold text-slate-800 hover:border-primary active:scale-95 transition-all cursor-pointer shrink-0 relative"
                id="mobile-open-filters-btn"
              >
                <div className="w-5 h-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 20V4m0 0L3 8m4-4l4 4M17 4v16m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>

              {/* Mobile Sort Dropdown */}
              <div className="relative shrink-0">
                <div className="flex items-center gap-1 px-2.5 py-2 bg-white border border-slate-200 rounded-2xl shadow-xs text-xs font-semibold text-slate-800 hover:border-slate-300 transition">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-transparent pr-4 outline-none cursor-pointer text-slate-800 font-semibold text-xs"
                    aria-label="Sort experiences"
                  >
                    <option value="featured">Featured</option>
                    <option value="rating">Top Rated</option>
                    <option value="price-low">Price: Low</option>
                    <option value="price-high">Price: High</option>
                  </select>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Mobile Experiences Count Sub-strip */}
            <div className="flex lg:hidden items-center justify-between text-[11px] text-slate-500 font-medium px-0.5">
              {loading ? (
                <span className="inline-block w-20 h-3 bg-slate-200 animate-pulse rounded" />
              ) : (
                <span>Showing <span className="text-primary font-bold">{filteredExperiences.length}</span> experiences</span>
              )}
            </div>

            {/* Desktop Top Row: Title, Result Count, Search & Sort (Hidden on Mobile) */}
            <div className="hidden lg:flex flex-row items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  All Curated Experiences &amp; Guided Activities
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {loading ? (
                    <span className="inline-flex items-center gap-1.5 text-slate-400">
                      <span className="w-5 h-3.5 bg-slate-200 animate-pulse rounded inline-block" />
                      <span>Loading handpicked activities &amp; experiences...</span>
                    </span>
                  ) : (
                    <>Showing <span className="text-primary font-bold">{filteredExperiences.length}</span> handpicked activities &amp; experiences</>
                  )}
                </p>
              </div>

              {/* Right: Search Input + Sort Dropdown on Desktop */}
              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative w-72 lg:w-80">
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
                    placeholder="Search experiences..."
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

            {/* Active Filter Badges */}
            {hasActiveFilters && filteredExperiences.length > 0 && (
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
                    Category: {selectedPropertyType}
                    <button onClick={() => setSelectedPropertyType("All")} className="hover:text-black cursor-pointer font-bold">×</button>
                  </span>
                )}
                {maxPriceValue < 25000 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    Max: ₹{maxPriceValue.toLocaleString()}
                    <button onClick={() => setMaxPriceValue(25000)} className="hover:text-primary cursor-pointer font-bold">×</button>
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

            {/* ─── Experiences Grid (Universal Single Cards, Balanced Layout) ─ */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 sm:gap-7 w-full">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <ExperienceCardSkeleton key={idx} />
                ))}
              </div>
            ) : paginatedExperiences.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 sm:gap-7 w-full">
                {paginatedExperiences.map((exp) => (
                  <ExperienceCard key={exp.id} item={exp} />
                ))}
              </div>
            ) : (
              /* Empty Results Fallback with Rich Graphic & Active Filters */
              <NoMatchFound
                entityName="experiences"
                activeFilters={activeFilterItems}
                onResetAll={clearAllFilters}
              />
            )}

            {/* ─── Sleek Pagination Controls ───────────────────────── */}
            {totalPages > 1 && (
              <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs sm:text-sm text-slate-500 font-medium">
                  Showing <span className="text-slate-900 font-bold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>–<span className="text-slate-900 font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredExperiences.length)}</span> of <span className="text-slate-900 font-bold">{filteredExperiences.length}</span> guided activities
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
                Show {filteredExperiences.length} Experiences
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
