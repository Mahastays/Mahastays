"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import ExploreMap, { PlaceMarker } from "./ExploreMap";
import {
  MapPin,
  Search,
  SlidersHorizontal,
  Mountain,
  Waves,
  Landmark,
  Compass,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Star,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Layers,
  Eye,
  Filter,
} from "lucide-react";
import api from "@/lib/api";

const CATEGORY_TABS = [
  { id: "all", label: "All Sights", icon: Compass },
  { id: "viewpoint", label: "Viewpoints", icon: Mountain },
  { id: "waterfall", label: "Waterfalls & Lakes", icon: Waves },
  { id: "fort", label: "Historic Forts", icon: Landmark },
  { id: "temple", label: "Sacred Temples", icon: Sparkles },
  { id: "garden", label: "Gardens & Agro", icon: CheckCircle2 },
  { id: "plateau", label: "Plateaus", icon: Layers },
];

export default function ExplorePlacesClient() {
  const [places, setPlaces] = useState<PlaceMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Filters
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeVicinity, setActiveVicinity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch places from backend
  useEffect(() => {
    setLoading(true);
    api
      .get("/places?limit=100")
      .then((res) => {
        const list = res.data?.data || [];
        setPlaces(list);
      })
      .catch(() => {
        // Fallback default list if backend is loading
        setPlaces([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtered places for the directory grid
  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const matchCat =
        activeCategory === "all" ||
        p.category.toLowerCase() === activeCategory.toLowerCase() ||
        (activeCategory === "waterfall" && (p.category === "waterfall" || p.category === "lake"));

      const matchVicinity =
        activeVicinity === "all" ||
        p.vicinity.toLowerCase().includes(activeVicinity.toLowerCase());

      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.vicinity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchVicinity && matchSearch;
    });
  }, [places, activeCategory, activeVicinity, searchQuery]);

  // Featured places for the perspective showcase (Reference Image 2)
  const featuredPlaces = useMemo(() => {
    return places.filter((p) => p.isFeatured).slice(0, 6);
  }, [places]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#ea110d] selection:text-white">
      {/* ─── HERO HEADER SECTION (Overlaid Above Map with Top Gradient) ─ */}
      <section className="relative pt-24 sm:pt-28 lg:pt-32 pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center z-10">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold uppercase tracking-wider mb-3">
          <span className="w-2 h-2 rounded-full bg-[#ea110d] animate-pulse" />
          <span>Interactive Landmark &amp; Sightseeing Guide</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight font-poppins max-w-4xl mx-auto leading-[1.12]">
          Explore Famous Places <br className="hidden sm:inline" />
          <span className="text-slate-900">&amp; Scenic Wonders of Mahabaleshwar</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mt-3 sm:mt-4 leading-relaxed font-roboto">
          An interactive geographical map and curated guide to the Western Ghats’ most breathtaking valleys,
          historic Maratha forts, roaring waterfalls, and serene mountain lakes.
        </p>

        {/* Floating Search & Filter Pill Bar (Reference Image 1 Style) */}
        <div className="mt-6 sm:mt-8 max-w-3xl mx-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl sm:rounded-full p-2 sm:p-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          {/* Location Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 w-full sm:w-auto text-left flex-1 border-b sm:border-b-0 sm:border-r border-slate-100">
            <MapPin className="w-4 h-4 text-[#ea110d] shrink-0" />
            <div className="min-w-0 flex-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Area
              </label>
              <select
                value={activeVicinity}
                onChange={(e) => setActiveVicinity(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="all">All Locations</option>
                <option value="Mahabaleshwar">Mahabaleshwar</option>
                <option value="Panchgani">Panchgani</option>
                <option value="Tapola">Tapola (Mini Kashmir)</option>
              </select>
            </div>
          </div>

          {/* Category Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 w-full sm:w-auto text-left flex-1 border-b sm:border-b-0 sm:border-r border-slate-100">
            <Compass className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Category
              </label>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="all">All Attractions</option>
                <option value="viewpoint">Viewpoints &amp; Peaks</option>
                <option value="waterfall">Waterfalls &amp; Lakes</option>
                <option value="fort">Historic Forts</option>
                <option value="temple">Sacred Temples</option>
                <option value="garden">Gardens &amp; Agro</option>
                <option value="plateau">Plateaus</option>
              </select>
            </div>
          </div>

          {/* Keyword Search Input */}
          <div className="flex items-center gap-2 px-3 py-1.5 w-full sm:w-auto flex-1">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search Arthur's Seat, Venna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent outline-none text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Reset button if filter active */}
          {(searchQuery || activeCategory !== "all" || activeVicinity !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
                setActiveVicinity("all");
              }}
              className="text-xs font-semibold text-[#ea110d] px-3 py-1.5 hover:underline whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </section>

      {/* ─── INTERACTIVE MAP WITH TOP GRADIENT (Reference Image 1) ─────── */}
      <section className="relative w-full -mt-10 sm:-mt-14 z-0">
        <ExploreMap
          places={places}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={(p) => setSelectedPlaceId(p.id)}
          activeCategory={activeCategory}
          searchQuery={searchQuery}
        />
      </section>

      {/* ─── METRIC STATS STRIP (Reference Image 1: $1B+, 20K+, etc.) ──── */}
      <section className="relative z-10 border-y border-slate-200/80 bg-slate-50/50 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-poppins">18+</div>
            <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Curated Viewpoints &amp; Peaks
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-poppins">12+</div>
            <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Waterfalls, Cascades &amp; Lakes
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-poppins">4.9★</div>
            <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Average Traveler Experience Rating
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-poppins">100%</div>
            <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Free &amp; Verified Travel Directory
            </div>
          </div>
        </div>
      </section>

  

      {/* ─── FULL DIRECTORY & PLACE CARDS GRID ─────────────────────────── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-100">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-[#ea110d] uppercase tracking-wider">
              Complete Travel Directory
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-poppins tracking-tight mt-1">
              All Famous Places to Visit
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Showing {filteredPlaces.length} verified places across Mahabaleshwar and Panchgani.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Places Bento Mosaic Grid (Text overlaid directly on image, only heading & location) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 auto-rows-[250px]">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl sm:rounded-3xl bg-slate-100 animate-pulse border border-slate-200 min-h-[250px]"
              />
            ))}
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Compass className="w-12 h-12 mx-auto mb-3 stroke-[1.5] text-slate-300" />
            <h3 className="text-base font-bold text-slate-800 font-poppins">No places found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try clearing your filters to see all famous attractions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 auto-rows-[250px] grid-flow-dense">
            {filteredPlaces.map((place, index) => {
              const imgUrl =
                place.coverImage ||
                place.images[0] ||
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";

              // Bento mosaic pattern matching the user's reference layout
              const getBentoCardClasses = (idx: number, total: number) => {
                if (total < 4) {
                  return "col-span-1 min-h-[280px] sm:min-h-[320px]";
                }
                const pattern = idx % 8;
                switch (pattern) {
                  case 0:
                    // Tall card spanning 2 rows
                    return "sm:col-span-1 sm:row-span-2 min-h-[440px] sm:min-h-[500px]";
                  case 2:
                    // Wide card spanning 2 columns
                    return "sm:col-span-2 sm:row-span-1 min-h-[240px] sm:min-h-[250px]";
                  case 5:
                    // Tall card spanning 2 rows
                    return "sm:col-span-1 sm:row-span-2 min-h-[440px] sm:min-h-[500px]";
                  case 7:
                    // Wide card spanning 2 columns
                    return "sm:col-span-2 sm:row-span-1 min-h-[240px] sm:min-h-[250px]";
                  default:
                    // Standard card
                    return "sm:col-span-1 sm:row-span-1 min-h-[240px] sm:min-h-[250px]";
                }
              };

              return (
                <Link
                  key={place.id}
                  href={`/explore/${place.slug || place.id}`}
                  className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 block ${getBentoCardClasses(
                    index,
                    filteredPlaces.length
                  )}`}
                >
                  {/* Full Card Background Image */}
                  <img
                    src={imgUrl}
                    alt={place.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    loading="lazy"
                    decoding="async"
                  />

                  {/* Dark Contrast Gradient Overlay for crystal clear typography */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 group-hover:via-black/50 transition-colors duration-300" />

                  {/* Top Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/40 text-white backdrop-blur-md border border-white/20 shadow-xs">
                      {place.category}
                    </span>
                    {place.isFeatured && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ea110d] text-white shadow-xs">
                        Must Visit
                      </span>
                    )}
                  </div>

                  {/* Text Overlaid On The Image: ONLY Heading and Location */}
                  <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 z-10 flex flex-col justify-end">
                    <h3 className="text-base sm:text-lg lg:text-xl font-extrabold text-white font-poppins tracking-tight leading-tight group-hover:text-red-200 transition-colors">
                      {place.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/85 mt-1.5 tracking-wide">
                      <MapPin className="w-3.5 h-3.5 text-[#ea110d] shrink-0" />
                      <span className="truncate">{place.vicinity}</span>
                    </div>
                  </div>

                  {/* Subtle Hover Arrow in bottom right */}
                  <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0">
                    <div className="w-8 h-8 rounded-full bg-white/25 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-xs">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── PROMOTIONAL BANNER: Luxury Stays Recommendation ───────────── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-10 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-xs font-bold text-[#ea110d] uppercase tracking-widest block mb-2 font-poppins">
              Stay Close to Nature
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-poppins leading-tight">
              Looking for Verified Luxury Cliff Villas &amp; Heritage Resorts?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-roboto leading-relaxed">
              Explore 100% verified private pool villas, boutique mountain cottages, and luxury stays across
              Mahabaleshwar and Panchgani.
            </p>
          </div>

          <Link
            href="/stays"
            className="inline-flex items-center gap-2 py-3.5 px-6 rounded-full bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs sm:text-sm font-bold shadow-lg transition active:scale-95 shrink-0"
          >
            <span>Browse All Stays &amp; Villas</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

