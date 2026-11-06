"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ZoomIn, ZoomOut, Crosshair, X, MapPin, ArrowRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProperties } from "@/store/slices/propertyslice";
import { fetchExperiences } from "@/store/slices/experienceslice";

interface MapPlaceItem {
  id: string;
  name: string;
  category: "stay" | "experience";
  subType: string;
  location: string;
  image: string;
  price: string;
  numericPrice?: number;
  rating: number;
  href: string;
  lat: number;
  lng: number;
  featured?: boolean;
}

// Center of Mahabaleshwar / Panchgani region
const MAHABALESHWAR_CENTER = { lat: 17.9350, lng: 73.6900 };

export default function MahabaleshwarMapSection() {
  const dispatch = useAppDispatch();
  const properties = useAppSelector((state) => state.properties.items);
  const experiences = useAppSelector((state) => state.experiences.items);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Filter state: 'all' | 'stays' | 'experiences'
  const [activeFilter, setActiveFilter] = useState<"all" | "stays" | "experiences">("all");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Map state
  const [center, setCenter] = useState(MAHABALESHWAR_CENTER);
  const [zoom, setZoom] = useState(13);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    dispatch(fetchProperties());
    dispatch(fetchExperiences());
  }, [dispatch]);

  // Transform actual database properties and experiences into physical coordinates
  const allPlaces: MapPlaceItem[] = useMemo(() => {
    const list: MapPlaceItem[] = [];

    // Helper to resolve coordinates for stays
    const resolveStayCoords = (prop: any, idx: number) => {
      if (
        typeof prop.address?.lat === "number" &&
        prop.address.lat >= 17.5 &&
        prop.address.lat <= 18.2 &&
        typeof prop.address?.lng === "number" &&
        prop.address.lng >= 73.4 &&
        prop.address.lng <= 74.0
      ) {
        return { lat: prop.address.lat, lng: prop.address.lng };
      }
      if (
        typeof prop.mapCoordinates?.lat === "number" &&
        prop.mapCoordinates.lat >= 17.5 &&
        prop.mapCoordinates.lat <= 18.2
      ) {
        return { lat: prop.mapCoordinates.lat, lng: prop.mapCoordinates.lng };
      }

      const text = `${prop.name || ""} ${prop.location || ""} ${prop.address?.fullAddress || ""} ${prop.city || ""}`.toLowerCase();
      if (text.includes("venna")) return { lat: 17.9290 + (idx % 2) * 0.003, lng: 73.6740 + (idx % 2) * 0.003 };
      if (text.includes("panchgani") || text.includes("table")) return { lat: 17.9237 + (idx % 2) * 0.004, lng: 73.8010 + (idx % 2) * 0.004 };
      if (text.includes("arthur") || text.includes("savitri")) return { lat: 17.9850 + (idx % 2) * 0.003, lng: 73.6180 + (idx % 2) * 0.003 };
      if (text.includes("kate") || text.includes("needle")) return { lat: 17.9333 + (idx % 2) * 0.003, lng: 73.6933 + (idx % 2) * 0.003 };
      if (text.includes("lingmala")) return { lat: 17.9180 + (idx % 2) * 0.003, lng: 73.6980 + (idx % 2) * 0.003 };
      if (text.includes("old mahabaleshwar")) return { lat: 17.9480 + (idx % 2) * 0.003, lng: 73.6620 + (idx % 2) * 0.003 };
      if (text.includes("tapola")) return { lat: 17.8200 + (idx % 2) * 0.004, lng: 73.7120 + (idx % 2) * 0.004 };

      // Clustered default spots across the valley
      const defaults = [
        { lat: 17.9237, lng: 73.6586 }, // Mahabaleshwar center
        { lat: 17.9295, lng: 73.6710 }, // Venna side
        { lat: 17.9380, lng: 73.6840 }, // Kate's Point road
        { lat: 17.9210, lng: 73.7450 }, // Panchgani highway
        { lat: 17.9260, lng: 73.7920 }, // Panchgani slopes
        { lat: 17.9150, lng: 73.6680 }, // Forest ridge
      ];
      const pt = defaults[idx % defaults.length];
      return {
        lat: pt.lat + (((idx * 7) % 11) - 5) * 0.002,
        lng: pt.lng + (((idx * 13) % 11) - 5) * 0.002,
      };
    };

    // Helper to resolve coordinates for experiences
    const resolveExpCoords = (exp: any, idx: number) => {
      if (
        typeof exp.coordinates?.lat === "number" &&
        exp.coordinates.lat >= 17.5 &&
        exp.coordinates.lat <= 18.2 &&
        typeof exp.coordinates?.lng === "number" &&
        exp.coordinates.lng >= 73.4 &&
        exp.coordinates.lng <= 74.0
      ) {
        return { lat: exp.coordinates.lat, lng: exp.coordinates.lng };
      }

      const text = `${exp.title || ""} ${exp.name || ""} ${exp.meetingPoint || ""} ${exp.city || ""}`.toLowerCase();
      if (text.includes("trek") || text.includes("arthur") || text.includes("sunrise")) {
        return { lat: 17.9820 + (idx % 2) * 0.003, lng: 73.6210 + (idx % 2) * 0.003 };
      }
      if (text.includes("boat") || text.includes("venna")) {
        return { lat: 17.9310 + (idx % 2) * 0.002, lng: 73.6760 + (idx % 2) * 0.002 };
      }
      if (text.includes("paraglid") || text.includes("panchgani")) {
        return { lat: 17.9280 + (idx % 2) * 0.003, lng: 73.8050 + (idx % 2) * 0.003 };
      }
      if (text.includes("waterfall") || text.includes("canyon") || text.includes("lingmala")) {
        return { lat: 17.9150 + (idx % 2) * 0.003, lng: 73.7020 + (idx % 2) * 0.003 };
      }

      const defaults = [
        { lat: 17.9780, lng: 73.6250 }, // Arthur's Seat
        { lat: 17.9300, lng: 73.6780 }, // Venna Lake Club
        { lat: 17.9250, lng: 73.7950 }, // Panchgani Plateau
        { lat: 17.9160, lng: 73.6950 }, // Lingmala Forest
        { lat: 17.9340, lng: 73.6890 }, // Kate's Point
      ];
      const pt = defaults[idx % defaults.length];
      return {
        lat: pt.lat + (((idx * 9) % 11) - 5) * 0.002,
        lng: pt.lng + (((idx * 11) % 11) - 5) * 0.002,
      };
    };

    // 1. Stays from API
    properties.forEach((prop, idx) => {
      const coords = resolveStayCoords(prop, idx);
      const img =
        typeof prop.images?.[0] === "string"
          ? prop.images[0]
          : prop.images?.[0]?.url ||
            prop.gallery?.[0] ||
            "https://images.unsplash.com/photo-1566073771259-6a8506099945";

      const priceNum = prop.numericPrice || prop.inrPrice || 5500;

      list.push({
        id: prop.id || prop._id,
        name: prop.name,
        category: "stay",
        subType: prop.propertyType === "villa" ? "Villa" : "Resort",
        location: prop.location || prop.city || "Mahabaleshwar",
        image: img,
        price: `₹${priceNum.toLocaleString("en-IN")}/night`,
        numericPrice: priceNum,
        rating: Number(prop.rating) || 4.8,
        href: `/stay/${prop.id || prop._id}`,
        lat: coords.lat,
        lng: coords.lng,
        featured: prop.featured,
      });
    });

    // 2. Experiences from API
    experiences.forEach((exp, idx) => {
      const coords = resolveExpCoords(exp, idx);
      const img =
        exp.image ||
        (Array.isArray(exp.gallery) && exp.gallery[0]) ||
        "https://images.unsplash.com/photo-1551632811-561732d1e306";

      const priceNum = exp.numericPrice || 350;

      list.push({
        id: exp.id || exp._id,
        name: exp.title || exp.name,
        category: "experience",
        subType: exp.category || "Experience",
        location: exp.meetingPoint || `${exp.city || "Mahabaleshwar"}, Maharashtra`,
        image: img,
        price: `₹${priceNum.toLocaleString("en-IN")}/person`,
        numericPrice: priceNum,
        rating: Number(exp.rating) || Number(exp.ratingScore) || 4.9,
        href: `/experiences/${exp.id || exp._id}`,
        lat: coords.lat,
        lng: coords.lng,
        featured: exp.featured,
      });
    });

    return list;
  }, [properties, experiences]);

  // Filtered places
  const displayedPlaces = useMemo(() => {
    if (activeFilter === "stays") return allPlaces.filter((p) => p.category === "stay");
    if (activeFilter === "experiences") return allPlaces.filter((p) => p.category === "experience");
    return allPlaces;
  }, [allPlaces, activeFilter]);

  // Active clicked item
  const activeItem = useMemo(() => {
    if (!activeItemId) return null;
    return allPlaces.find((p) => p.id === activeItemId) || null;
  }, [allPlaces, activeItemId]);

  // Calculate dynamic bounding box for real OpenStreetMap
  const delta = useMemo(() => {
    switch (zoom) {
      case 15:
        return { lng: 0.05, lat: 0.03 };
      case 14:
        return { lng: 0.09, lat: 0.05 };
      case 12:
        return { lng: 0.22, lat: 0.12 };
      case 11:
        return { lng: 0.32, lat: 0.18 };
      case 13:
      default:
        return { lng: 0.14, lat: 0.08 };
    }
  }, [zoom]);

  const minLng = center.lng - delta.lng;
  const maxLng = center.lng + delta.lng;
  const minLat = center.lat - delta.lat;
  const maxLat = center.lat + delta.lat;

  // Convert GPS coordinates into container percentage
  const getMarkerPosition = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return {
      left: `${Math.min(93, Math.max(7, x))}%`,
      top: `${Math.min(88, Math.max(12, y))}%`,
      rawX: x,
      rawY: y,
    };
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(15, z + 1));
  const handleZoomOut = () => setZoom((z) => Math.max(11, z - 1));
  const handleResetCenter = () => {
    setCenter(MAHABALESHWAR_CENTER);
    setZoom(13);
  };

  // Panning map with drag
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag when clicking background, not buttons or markers
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("a")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    const latShift = (dy / (mapContainerRef.current?.clientHeight || 600)) * latSpan;
    const lngShift = -(dx / (mapContainerRef.current?.clientWidth || 1000)) * lngSpan;

    setCenter((prev) => ({
      lat: Math.min(18.1, Math.max(17.7, prev.lat + latShift)),
      lng: Math.min(74.0, Math.max(73.4, prev.lng + lngShift)),
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  // Real OpenStreetMap embed source
  const mapIframeSrc = useMemo(() => {
    const bMinLng = minLng.toFixed(5);
    const bMinLat = minLat.toFixed(5);
    const bMaxLng = maxLng.toFixed(5);
    const bMaxLat = maxLat.toFixed(5);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bMinLng}%2C${bMinLat}%2C${bMaxLng}%2C${bMaxLat}&layer=mapnik`;
  }, [minLng, minLat, maxLng, maxLat]);

  const staysCount = allPlaces.filter((p) => p.category === "stay").length;
  const expCount = allPlaces.filter((p) => p.category === "experience").length;

  return (
    <section className="w-full pt-8 sm:pt-12 pb-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="destination-map">
      {/* ─── Header: Clean, Professional Layout ────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-[#ea110d] animate-pulse" />
            <span>Interactive Map</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Explore Mahabaleshwar &amp; Handpicked Stays
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 max-w-xl">
            Click on markers across Mahabaleshwar, Venna Lake, and Panchgani to preview stays and experiences.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            All ({allPlaces.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("stays")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              activeFilter === "stays"
                ? "bg-[#ea110d] text-white border-[#ea110d] shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeFilter === "stays" ? "bg-white" : "bg-[#ea110d]"}`} />
            <span>Stays ({staysCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("experiences")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              activeFilter === "experiences"
                ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeFilter === "experiences" ? "bg-white" : "bg-slate-800"}`} />
            <span>Experiences ({expCount})</span>
          </button>
        </div>
      </div>

      {/* ─── Actual Real Map Container ───────────────────────────────── */}
      <div
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-[520px] sm:h-[580px] lg:h-[620px] rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        aria-label="Mahabaleshwar Regional Map"
      >
        {/* Real OpenStreetMap Layer */}
        <div className="absolute inset-0 pointer-events-none">
          <iframe
            title="Mahabaleshwar Actual Real Map"
            src={mapIframeSrc}
            className="w-full h-full border-0 pointer-events-none filter contrast-105"
            tabIndex={-1}
          />
        </div>

        {/* Map Pan / Zoom Controls in Top Right */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-1 shadow-md">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 hover:text-[#ea110d] hover:bg-slate-100 transition cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-200 mx-1" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 hover:text-[#ea110d] hover:bg-slate-100 transition cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-200 mx-1" />
          <button
            type="button"
            onClick={handleResetCenter}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 hover:text-[#ea110d] hover:bg-slate-100 transition cursor-pointer"
            title="Reset Map Center"
            aria-label="Reset Map Center"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* ─── LIVE MARKER PINS ON MAP ─────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none">
          {displayedPlaces.map((place) => {
            const pos = getMarkerPosition(place.lat, place.lng);
            const isSelected = activeItemId === place.id;
            const isStay = place.category === "stay";

            return (
              <div
                key={place.id}
                style={{ left: pos.left, top: pos.top }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group transition-all duration-200 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveItemId(isSelected ? null : place.id);
                }}
              >
                <div
                  className={`relative flex flex-col items-center transition-transform duration-200 ${
                    isSelected ? "scale-115 z-30" : "scale-100 hover:scale-110"
                  }`}
                >
                  {/* Circular Thumbnail Pin */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 bg-white relative shadow-md transition-all ${
                      isSelected
                        ? isStay
                          ? "border-[#ea110d] ring-4 ring-[#ea110d]/30"
                          : "border-slate-900 ring-4 ring-slate-900/30"
                        : isStay
                        ? "border-[#ea110d] ring-2 ring-white"
                        : "border-slate-800 ring-2 ring-white"
                    }`}
                  >
                    <img
                      src={place.image}
                      alt={place.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />

                    {/* Small category dot badge */}
                    <span
                      className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${
                        isStay ? "bg-[#ea110d]" : "bg-slate-800"
                      }`}
                    />
                  </div>

                  {/* Tiny Name Pill underneath pin */}
                  <div
                    className={`mt-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap transition-all border max-w-[84px] truncate shadow-xs ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white/95 text-slate-800 border-slate-200 group-hover:bg-slate-900 group-hover:text-white"
                    }`}
                  >
                    {place.name.split(" ")[0]}
                  </div>

                  {/* Pin Tip Arrow */}
                  <div
                    className={`w-1.5 h-1.5 rotate-45 -mt-1 ${
                      isSelected ? "bg-slate-900" : "bg-white border-r border-b border-slate-200"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── SMALL POPUP CARD ON CLICK (Only required info) ──────────── */}
        {activeItem && (() => {
          const pos = getMarkerPosition(activeItem.lat, activeItem.lng);
          const isNearTop = pos.rawY < 35;
          const isStay = activeItem.category === "stay";

          return (
            <>
              {/* DESKTOP & TABLET FLOATING MINI-CARD (Near Clicked Pin) */}
              <div
                style={{
                  left: pos.left,
                  top: pos.top,
                }}
                className={`hidden sm:block absolute z-30 pointer-events-auto transition-all duration-200 -translate-x-1/2 ${
                  isNearTop ? "mt-7" : "-translate-y-full -mt-7"
                }`}
              >
                <div className="w-[270px] bg-white rounded-2xl p-2.5 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95">
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveItemId(null);
                    }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer"
                    aria-label="Close card"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-2.5">
                    {/* Small Image */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-100">
                      <img
                        src={activeItem.image}
                        alt={activeItem.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Small Details */}
                    <div className="flex-1 min-w-0 pr-4">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider block ${
                          isStay ? "text-[#ea110d]" : "text-slate-600"
                        }`}
                      >
                        {activeItem.subType}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
                        {activeItem.name}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-black text-slate-900">
                          {activeItem.price}
                        </span>
                        <Link
                          href={activeItem.href}
                          className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#ea110d] hover:underline"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Arrow Pointer */}
                  {isNearTop ? (
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-l border-t border-slate-200" />
                  ) : (
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-slate-200" />
                  )}
                </div>
              </div>

              {/* MOBILE DOCKED MINI-CARD (Bottom of Map) */}
              <div className="sm:hidden absolute bottom-3 left-3 right-3 z-30 pointer-events-auto animate-in slide-in-from-bottom-2 fade-in duration-200">
                <div className="bg-white rounded-2xl p-2.5 shadow-xl border border-slate-200 relative flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                    <img
                      src={activeItem.image}
                      alt={activeItem.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider block ${
                        isStay ? "text-[#ea110d]" : "text-slate-600"
                      }`}
                    >
                      {activeItem.subType}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {activeItem.name}
                    </h4>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs font-black text-slate-900">
                        {activeItem.price}
                      </span>
                      <Link
                        href={activeItem.href}
                        className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#ea110d] hover:underline"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveItemId(null);
                    }}
                    className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 self-start mt-0.5"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </section>
  );
}
