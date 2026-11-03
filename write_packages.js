const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'packages', 'page.tsx');

const fullFile = `"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PackageCard, { PackageData } from "../components/PackageCard";
import AdHeroCarousel, { AdSlide } from "../components/AdHeroCarousel";

// ─── Top Red-Themed Showcase Ad Banner Carousel ────────────────
const PACKAGES_AD_SLIDES: AdSlide[] = [
  {
    id: "adventure-packages",
    badge: "SPECIAL HOLIDAY OFFER",
    title: "Your Dream Vacation Starts Here",
    subtitle: "Handcrafted holiday bundles. Verified luxury resorts. Memories that last forever.",
    ctaText: "Discover Packages",
    ctaTarget: "#packages-catalog",
    image: "/amalfi-package.jpg",
    categoryTag: "All",
  },
  {
    id: "santorini-romance-ad",
    badge: "HONEYMOON & ROMANCE",
    title: "All-Inclusive Romance & Sunset Yachting",
    subtitle: "Cliffside cave pool lofts, volcanic wine tastings, and private catamaran cruises.",
    ctaText: "Explore Honeymoon",
    ctaTarget: "#packages-catalog",
    image: "/santorini-package.jpg",
    categoryTag: "Honeymoon",
  },
  {
    id: "swiss-wellness-ad",
    badge: "ALPINE EXPEDITIONS",
    title: "Swiss Alpine Ski & Thermal Spa Sanctuary",
    subtitle: "Ski-in chalets, outdoor heated cedar hydrotherapy pools, and roaring fireplaces.",
    ctaText: "View Alpine Trips",
    ctaTarget: "#packages-catalog",
    image: "/swiss-package.jpg",
    categoryTag: "Adventure",
  },
  {
    id: "maldives-island-ad",
    badge: "OVERWATER DREAMS",
    title: "Private Atoll Lagoons & Reef Safaris",
    subtitle: "Seaplane arrivals, private sandbank picnics, and crystal water villas with lagoon slides.",
    ctaText: "View Island Bundles",
    ctaTarget: "#packages-catalog",
    image: "/maldives-villa.jpg",
    categoryTag: "Island",
  },
];

// ─── Comprehensive Packages Catalog (Universal Package Cards) ──
const PACKAGES_DATA: PackageData[] = [
  {
    id: "santorini-honeymoon-bundle",
    title: "Santorini Caldera Romance & Sunset Cruise",
    badge: "Honeymoon Special",
    rating: "9.8/10 ★",
    price: "From ₹85,000 / couple",
    numericPrice: 85000,
    shortDesc: "5-day romantic escape with private cliffside infinity pool, sunset champagne cruise around the volcano, and volcanic wine tasting.",
    fullDesc: "5-day romantic escape with private cliffside infinity pool, sunset champagne cruise around the volcano, complimentary sommelier wine tour, and candlelit cliffside dinners over the Aegean Sea.",
    images: ["/santorini-package.jpg", "/santorini-loft.jpg"],
    location: "Oia, Santorini, Greece",
    city: "Santorini",
    country: "Greece",
    category: "Honeymoon",
    durationDays: 5,
    featured: true,
  },
  {
    id: "amalfi-riva-escape",
    title: "Amalfi Coastal Riva & Capri Yacht Tour",
    badge: "Luxury Choice",
    rating: "9.7/10 ★",
    price: "From ₹1,10,000 / package",
    numericPrice: 110000,
    shortDesc: "6 days of Italian coastal glamour with a private wooden Riva yacht charter to Capri, cliffside suite, and Michelin-star dining.",
    fullDesc: "6 days of Italian coastal glamour with a private wooden Riva yacht charter to Capri, cliffside suite, Michelin dining, and chauffeured vintage Alfa Romeo transfers along the coast.",
    images: ["/amalfi-package.jpg"],
    location: "Positano, Amalfi Coast, Italy",
    city: "Amalfi Coast",
    country: "Italy",
    category: "Luxury",
    durationDays: 6,
    featured: true,
  },
  {
    id: "swiss-matterhorn-chalet-expedition",
    title: "Matterhorn Ski & Alpine Thermal Spa",
    badge: "Alpine Favorite",
    rating: "9.9/10 ★",
    price: "From ₹1,25,000 / package",
    numericPrice: 125000,
    shortDesc: "Ski-in/ski-out chalet luxury facing the Matterhorn, outdoor heated hydrotherapy spa, private chef fondue dinners, and ski passes.",
    fullDesc: "Ski-in/ski-out chalet luxury facing the Matterhorn, outdoor heated hydrotherapy spa, private chef fondue dinners, and unlimited Zermatt alpine ski passes.",
    images: ["/swiss-package.jpg"],
    location: "Zermatt, Swiss Alps, Switzerland",
    city: "Swiss Alps",
    country: "Switzerland",
    category: "Adventure",
    durationDays: 7,
    featured: true,
  },
  {
    id: "ubud-rainforest-yoga-reset",
    title: "Ubud Jungle Yoga & Ayurvedic Sanctuary",
    badge: "Wellness Retreat",
    rating: "9.5/10 ★",
    price: "From ₹65,000 / package",
    numericPrice: 65000,
    shortDesc: "Perched above lush tropical rainforest with private river infinity pool, daily yoga pavilions, Ayurvedic spa rituals, and organic meals.",
    fullDesc: "Perched above lush tropical rainforest with private river infinity pool, daily yoga pavilions, Ayurvedic massages, hot spring baths, and personalized farm-to-table organic dining.",
    images: ["/ubud-package.jpg", "/bali-villa.jpg"],
    location: "Ubud, Bali, Indonesia",
    city: "Bali",
    country: "Indonesia",
    category: "Wellness",
    durationDays: 5,
    featured: true,
  },
  {
    id: "maldives-overwater-paradise-package",
    title: "Maldives Lagoon Seaplane & Water Villa",
    badge: "Overwater Dreams",
    rating: "9.9/10 ★",
    price: "From ₹1,45,000 / couple",
    numericPrice: 145000,
    shortDesc: "All-inclusive overwater lagoon villa with scenic seaplane transfer, private chef sandbank dinners, and dolphin catamaran voyage.",
    fullDesc: "All-inclusive overwater lagoon villa with scenic seaplane transfer, private chef sandbank dinners, private catamaran dolphin watching, and guided bioluminescent night snorkeling.",
    images: ["/maldives-villa.jpg"],
    location: "Noonu Atoll, Maldives",
    city: "Maldives",
    country: "Maldives",
    category: "Island",
    durationDays: 6,
    featured: true,
  },
  {
    id: "dubai-desert-city-duo",
    title: "Dubai Royal Suite & Desert Oasis Glamping",
    badge: "City & Desert Icon",
    rating: "9.6/10 ★",
    price: "From ₹78,000 / package",
    numericPrice: 78000,
    shortDesc: "3 nights in a downtown Burj view suite plus 2 nights ultra-luxury glamping in a private Bedouin desert oasis with dune safaris.",
    fullDesc: "3 nights in a downtown Burj view suite plus 2 nights glamping in an ultra-luxurious private Bedouin desert oasis with dune safaris, falconry shows, and private stargazing dinners.",
    images: ["/dubai-suite.jpg"],
    location: "Downtown & Desert, Dubai",
    city: "Dubai",
    country: "UAE",
    category: "Luxury",
    durationDays: 5,
  },
  {
    id: "kashmir-paradise-houseboat-package",
    title: "Kashmir Paradise: Dal Lake & Gulmarg Snow",
    badge: "Heaven on Earth",
    rating: "9.8/10 ★",
    price: "From ₹48,000 / couple",
    numericPrice: 48000,
    shortDesc: "Heritage cedar wood houseboat stay on Dal Lake with private Shikara rides, Gulmarg Gondola snow expedition, and Mughal gardens.",
    fullDesc: "Heritage cedar wood houseboat stay on Dal Lake with private Shikara rides, Gulmarg Gondola Phase 2 snow expedition, Pahalgam valley horse ride, and traditional Kashmiri Wazwan dinners.",
    images: ["/hero-resort.jpg", "/ubud-package.jpg"],
    location: "Srinagar & Gulmarg, Kashmir, India",
    city: "Kashmir",
    country: "India",
    category: "Honeymoon",
    durationDays: 6,
    featured: true,
  },
  {
    id: "rajasthan-royal-palaces-package",
    title: "Rajasthan Royal Palaces: Udaipur & Jaipur",
    badge: "Royal Heritage",
    rating: "9.7/10 ★",
    price: "From ₹55,000 / package",
    numericPrice: 55000,
    shortDesc: "Live like royalty in restored heritage palaces, private boat cruise on Lake Pichola, Amber Fort trails, and folk cultural dinners.",
    fullDesc: "Live like royalty in restored 200-year-old heritage palaces, private sunset boat cruise on Lake Pichola, private chauffeur guided Amber Fort tour, and royal Rajasthani thali dining.",
    images: ["/dubai-suite.jpg", "/amalfi-package.jpg"],
    location: "Udaipur & Jaipur, Rajasthan, India",
    city: "Rajasthan",
    country: "India",
    category: "Heritage",
    durationDays: 7,
  },
  {
    id: "paris-chateau-loire-escape",
    title: "Parisian Elegance & Loire Valley Châteaux",
    badge: "Romance & Culture",
    rating: "9.6/10 ★",
    price: "From ₹1,15,000 / couple",
    numericPrice: 115000,
    shortDesc: "Haute couture shopping, private Seine dinner cruise, first-class TGV rail to fairy-tale Renaissance châteaux with wine tastings.",
    fullDesc: "Haute couture shopping, private Seine dinner cruise under the Eiffel Tower, first-class TGV rail to fairy-tale Renaissance châteaux with private wine cellar tastings and palace gardens.",
    images: ["/santorini-package.jpg"],
    location: "Paris & Loire Valley, France",
    city: "Paris",
    country: "France",
    category: "Honeymoon",
    durationDays: 5,
  },
  {
    id: "south-africa-safari-capetown",
    title: "Kruger Big-5 Safari & Cape Town Coast",
    badge: "Wildlife Expedition",
    rating: "9.9/10 ★",
    price: "From ₹1,35,000 / package",
    numericPrice: 135000,
    shortDesc: "Thrilling open-top 4x4 Big Five game drives, luxury tented bush lodge with plunge pool, Table Mountain, and Stellenbosch vineyards.",
    fullDesc: "Thrilling open-top 4x4 Big Five game drives, luxury tented bush lodge with private plunge pool, Table Mountain cable car, Boulders Beach penguins, and Stellenbosch wine tastings.",
    images: ["/activities/croatia-activity.jpg"],
    location: "Kruger Park & Cape Town, South Africa",
    city: "Cape Town",
    country: "South Africa",
    category: "Adventure",
    durationDays: 8,
  },
  {
    id: "iceland-aurora-blue-lagoon",
    title: "Iceland Aurora Borealis & Geothermal Spa",
    badge: "Arctic Wonder",
    rating: "9.8/10 ★",
    price: "From ₹1,40,000 / package",
    numericPrice: 140000,
    shortDesc: "Superjeep Northern Lights hunt, soaking in the ethereal silica waters of Blue Lagoon Retreat, erupting geysers, and glacier caves.",
    fullDesc: "Superjeep Northern Lights hunt, soaking in the ethereal silica waters of Blue Lagoon Retreat, erupting geysers, Gullfoss waterfall, and blue glacier ice cave exploration.",
    images: ["/swiss-package.jpg"],
    location: "Reykjavik & Golden Circle, Iceland",
    city: "Reykjavik",
    country: "Iceland",
    category: "Adventure",
    durationDays: 6,
  },
  {
    id: "kyoto-tokyo-ryokan-zen",
    title: "Kyoto Bamboo Groves & Mount Fuji Onsen",
    badge: "Zen Serenity",
    rating: "9.7/10 ★",
    price: "From ₹1,30,000 / package",
    numericPrice: 130000,
    shortDesc: "Traditional tatami ryokan stay with private volcanic hot spring onsen, tea ceremonies with Geishas, and scenic Hakone ropeway.",
    fullDesc: "Traditional tatami ryokan stay with private volcanic hot spring onsen, tea ceremonies with Geishas, Shinkansen bullet train rides, and morning walks through Arashiyama bamboo forest.",
    images: ["/bali-villa.jpg"],
    location: "Kyoto & Hakone, Japan",
    city: "Kyoto",
    country: "Japan",
    category: "Heritage",
    durationDays: 7,
  },
];

const ITEMS_PER_PAGE = 6;

export default function PackagesPage() {
  // ─── Filter Sidebar State (Matching Image 1) ─────────────────
  const [destinationSearch, setDestinationSearch] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  const [travelersCount, setTravelersCount] = useState<number>(2);
  const [maxPriceValue, setMaxPriceValue] = useState<number>(150000);
  const [selectedTheme, setSelectedTheme] = useState<string>("All");

  // ─── Top Bar & Horizontal Tag State (Matching Image 2) ───────
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");

  // ─── Pagination State ────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleAdCtaClick = (slide: AdSlide) => {
    if (slide.categoryTag) {
      setSelectedTheme(slide.categoryTag);
    }
    const catalogElement = document.getElementById("packages-catalog");
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Reset page to 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    destinationSearch,
    checkInDate,
    checkOutDate,
    travelersCount,
    maxPriceValue,
    selectedTheme,
    selectedTag,
    searchQuery,
    sortBy,
  ]);

  // Filtered & Sorted Packages
  const filteredPackages = useMemo(() => {
    return PACKAGES_DATA.filter((pkg) => {
      // 1. Theme Filter (All, Honeymoon, Adventure, Wellness, Island, Heritage, Luxury)
      if (selectedTheme !== "All") {
        if (!pkg.category.toLowerCase().includes(selectedTheme.toLowerCase())) {
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
      if (selectedTag !== "all") {
        const queryTag = selectedTag.toLowerCase();
        const inTitle = pkg.title.toLowerCase().includes(queryTag);
        const inDesc = (pkg.shortDesc + " " + (pkg.fullDesc || "")).toLowerCase().includes(queryTag);
        const inCat = pkg.category.toLowerCase().includes(queryTag);
        const inLoc = (pkg.location || "").toLowerCase().includes(queryTag);
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
    selectedTheme,
    destinationSearch,
    maxPriceValue,
    selectedTag,
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
    travelersCount !== 2 ||
    maxPriceValue < 150000 ||
    selectedTheme !== "All" ||
    selectedTag !== "all" ||
    searchQuery.trim() !== "" ||
    sortBy !== "featured";

  const clearAllFilters = () => {
    setDestinationSearch("");
    setCheckInDate("");
    setCheckOutDate("");
    setTravelersCount(2);
    setMaxPriceValue(150000);
    setSelectedTheme("All");
    setSelectedTag("all");
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
      label: "Island & Beach",
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
      label: "Alpine & Mountain",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
        </svg>
      ),
    },
    {
      id: "honeymoon",
      label: "Honeymoon & Romance",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
    {
      id: "wellness",
      label: "Wellness Retreats",
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
      label: "Safari & Wildlife",
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

  return (
    <main className="flex flex-col min-h-screen w-full bg-slate-50 antialiased relative">
      {/* ─── Sticky/Glassmorphic Header ───────────────────────── */}
      <Navbar />

      {/* ─── Above The Hero: Red-Themed Showcase Ad Banner Carousel ── */}
      <AdHeroCarousel slides={PACKAGES_AD_SLIDES} onCtaClick={handleAdCtaClick} />

      {/* ─── Main Catalog Section (Expanded Width: max-w-[1440px]) ── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-8 sm:py-12 w-full" id="packages-catalog">
        {/* Main 2-Column Layout */}
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* ─── LEFT SIDEBAR: FILTERS CARD (EXACT LAYOUT FROM IMAGE 1) ── */}
          <aside className="w-full lg:w-80 xl:w-84 shrink-0 lg:sticky lg:top-24 bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5">
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
                <span>Travel Dates</span>
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
                    <div className="text-xs font-bold text-slate-800 leading-tight">Start Date</div>
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
                    <div className="text-xs font-bold text-slate-800 leading-tight">End Date</div>
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

            {/* 3. Guests / Travelers Section */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Travelers</span>
              </label>
              <div className="relative">
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-xs text-xs sm:text-sm font-semibold text-slate-800 hover:border-slate-300 transition cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>{travelersCount === 1 ? "1 Traveler" : \`\${travelersCount} Travelers\`}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-slate-400">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
                <select
                  value={travelersCount}
                  onChange={(e) => setTravelersCount(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                >
                  <option value={1}>1 Traveler</option>
                  <option value={2}>2 Travelers</option>
                  <option value={3}>3 Travelers</option>
                  <option value={4}>4 Travelers</option>
                  <option value={5}>5+ Travelers</option>
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
                  <span>Package Budget</span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  ₹0 - ₹\${maxPriceValue.toLocaleString()}
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

            {/* 5. Package Theme Section */}
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Package Theme</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["All", "Honeymoon", "Adventure", "Wellness", "Island", "Heritage", "Luxury"].map((theme) => {
                  const isActive = selectedTheme.toLowerCase() === theme.toLowerCase();
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setSelectedTheme(theme)}
                      className={\`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer \${
                        isActive
                          ? "bg-primary text-white shadow-sm shadow-red-500/20"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                      }\`}
                    >
                      {theme}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ─── RIGHT CONTENT: TOOLBAR & GRID (EXACT LAYOUT FROM IMAGE 2) ── */}
          <div className="flex-1 w-full space-y-5">
            {/* Top Row: Title, Result Count, Search & Sort */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  All Exclusive Holiday Packages &amp; Escapes
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Showing <span className="text-primary font-bold">{filteredPackages.length}</span> handpicked holiday packages for your dream getaway
                </p>
              </div>

              {/* Right: Search Input + Sort Dropdown */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Search Bar */}
                <div className="relative w-full sm:w-72 lg:w-80">
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
                    placeholder="Search packages, destinations, or tours..."
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

            {/* Second Row: Horizontal Category / Theme Tabs with Icons (From Image 2) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none">
              {PACKAGE_TABS.map((tab) => {
                const isActive = selectedTag === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTag(tab.id)}
                    className={\`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer \${
                      isActive
                        ? "bg-primary text-white shadow-sm shadow-red-500/20"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
                    }\`}
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
            {hasActiveFilters && (
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
                {selectedTheme !== "All" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    Theme: {selectedTheme}
                    <button onClick={() => setSelectedTheme("All")} className="hover:text-black cursor-pointer font-bold">×</button>
                  </span>
                )}
                {selectedTag !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    Category: {PACKAGE_TABS.find(t => t.id === selectedTag)?.label || selectedTag}
                    <button onClick={() => setSelectedTag("all")} className="hover:text-black cursor-pointer font-bold">×</button>
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
            {paginatedPackages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
                {paginatedPackages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            ) : (
              /* Empty Results Fallback */
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-sm max-w-md mx-auto my-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3.5 text-2xl">
                  🔍
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">No matching packages found</h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-5">
                  Try adjusting or clearing your filters to explore other curated holiday packages.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2 bg-primary text-white text-xs sm:text-sm font-semibold rounded-full shadow-md hover:bg-primary-hover transition-all cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
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
                        className={\`w-9 h-9 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer \${
                          isActive
                            ? "bg-primary text-white shadow-[0_2px_10px_rgba(234,17,13,0.35)] scale-105"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
                        }\`}
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
    </main>
  );
}
`;

fs.writeFileSync(filePath, fullFile, 'utf8');
console.log("Packages page updated successfully!");
