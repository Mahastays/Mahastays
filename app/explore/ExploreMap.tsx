"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Layers,
  ExternalLink,
  ChevronRight,
  Clock,
  Tag,
  Star,
  Mountain,
  Waves,
  Landmark,
  Compass,
} from "lucide-react";

export interface PlaceMarker {
  id: string;
  name: string;
  slug: string;
  category: string;
  vicinity: string;
  shortDescription: string;
  latitude: number;
  longitude: number;
  altitude?: string | null;
  coverImage?: string | null;
  images: string[];
  timings?: string | null;
  entryFee?: string | null;
  highlights?: string[];
  isFeatured?: boolean;
}

interface ExploreMapProps {
  places: PlaceMarker[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (place: PlaceMarker) => void;
  activeCategory?: string;
  searchQuery?: string;
}

// Center of Mahabaleshwar / Panchgani region
const MAHABALESHWAR_CENTER = { lat: 17.9250, lng: 73.6800 };

export default function ExploreMap({
  places,
  selectedPlaceId,
  onSelectPlace,
  activeCategory = "all",
  searchQuery = "",
}: ExploreMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Map view state
  const [center, setCenter] = useState(MAHABALESHWAR_CENTER);
  const [zoom, setZoom] = useState(13); // Zoom delta range
  const [mapStyle, setMapStyle] = useState<"light" | "topo" | "satellite">("light");
  const [selectedPlace, setSelectedPlace] = useState<PlaceMarker | null>(null);

  // Drag-to-pan state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Sync selectedPlaceId if passed externally
  useEffect(() => {
    if (selectedPlaceId) {
      const found = places.find((p) => p.id === selectedPlaceId || p.slug === selectedPlaceId);
      if (found) {
        setSelectedPlace(found);
        setCenter({ lat: found.latitude, lng: found.longitude });
      }
    }
  }, [selectedPlaceId, places]);

  // Default to first featured place if none selected
  useEffect(() => {
    if (!selectedPlace && places.length > 0) {
      const initial = places.find((p) => p.isFeatured) || places[0];
      setSelectedPlace(initial);
    }
  }, [places, selectedPlace]);

  // Filtered places to display as pins
  const displayedPlaces = useMemo(() => {
    return places.filter((p) => {
      const matchCat =
        !activeCategory ||
        activeCategory === "all" ||
        p.category.toLowerCase() === activeCategory.toLowerCase();
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.vicinity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [places, activeCategory, searchQuery]);

  // Compute bounding box coordinates for OpenStreetMap / CartoDB tile embed
  const delta = useMemo(() => {
    switch (zoom) {
      case 15:
        return 0.035;
      case 14:
        return 0.06;
      case 12:
        return 0.16;
      case 11:
        return 0.28;
      case 13:
      default:
        return 0.10;
    }
  }, [zoom]);

  // Bounding box for map rendering
  const minLng = center.lng - delta;
  const maxLng = center.lng + delta;
  const minLat = center.lat - delta * 0.55;
  const maxLat = center.lat + delta * 0.55;

  // Convert GPS coordinates into percentage positions inside container
  const getMarkerPosition = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { left: `${Math.min(94, Math.max(6, x))}%`, top: `${Math.min(90, Math.max(10, y))}%` };
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(15, z + 1));
  const handleZoomOut = () => setZoom((z) => Math.max(11, z - 1));
  const handleResetCenter = () => {
    setCenter(MAHABALESHWAR_CENTER);
    setZoom(13);
    if (places[0]) setSelectedPlace(places[0]);
  };

  // Handle marker selection
  const handleMarkerClick = (place: PlaceMarker) => {
    setSelectedPlace(place);
    setCenter({ lat: place.latitude, lng: place.longitude });
    if (onSelectPlace) onSelectPlace(place);
  };

  // Drag mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    // Convert pixel drag to lat/lng delta
    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    const latShift = (dy / (containerRef.current?.clientHeight || 600)) * latSpan;
    const lngShift = -(dx / (containerRef.current?.clientWidth || 1000)) * lngSpan;

    setCenter((prev) => ({
      lat: Math.min(18.2, Math.max(17.6, prev.lat + latShift)),
      lng: Math.min(74.1, Math.max(73.3, prev.lng + lngShift)),
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  // Map layer URL
  const mapIframeSrc = useMemo(() => {
    const bMinLng = minLng.toFixed(5);
    const bMinLat = minLat.toFixed(5);
    const bMaxLng = maxLng.toFixed(5);
    const bMaxLat = maxLat.toFixed(5);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bMinLng}%2C${bMinLat}%2C${bMaxLng}%2C${bMaxLat}&layer=mapnik`;
  }, [minLng, minLat, maxLng, maxLat]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-[580px] sm:h-[640px] lg:h-[700px] overflow-hidden select-none ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      aria-label="Interactive Map of Famous Places in Mahabaleshwar"
    >
      {/* ─── BASE MAP LAYER: Clean, High-Contrast Map ────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <iframe
          title="Mahabaleshwar Regional Map"
          src={mapIframeSrc}
          className="w-full h-full border-0 filter grayscale contrast-115 brightness-105 pointer-events-none"
          tabIndex={-1}
        />
      </div>

      {/* ─── TOP & BOTTOM GRADIENT MASKS (Smoothly fades from navbar into map) ─── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.78) 18%, rgba(255,255,255,0.1) 42%, rgba(255,255,255,0.1) 65%, rgba(255,255,255,0.85) 90%, #ffffff 100%)",
        }}
      />

      {/* ─── MAP CONTROLS (Top Right of Map) ──────────────────────────────── */}
      <div className="absolute top-24 right-4 sm:right-6 z-20 flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-lg p-1 flex flex-col gap-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-[#ea110d] hover:bg-slate-100 transition cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-200 mx-1" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-[#ea110d] hover:bg-slate-100 transition cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-200 mx-1" />
          <button
            type="button"
            onClick={handleResetCenter}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-[#ea110d] hover:bg-slate-100 transition cursor-pointer"
            title="Reset Map to Mahabaleshwar Center"
            aria-label="Reset Map"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── LIVE MARKER PINS ON MAP ───────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {displayedPlaces.map((place) => {
          const pos = getMarkerPosition(place.latitude, place.longitude);
          const isSelected = selectedPlace?.id === place.id;
          const imgUrl =
            place.coverImage ||
            place.images[0] ||
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80";

          return (
            <div
              key={place.id}
              style={{ left: pos.left, top: pos.top }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group transition-all duration-300"
              onClick={() => handleMarkerClick(place)}
            >
              {/* Marker Container */}
              <div
                className={`relative flex flex-col items-center transition-transform duration-300 ${
                  isSelected ? "scale-115 z-30" : "scale-100 hover:scale-110 z-10"
                }`}
              >
                {/* Circular Image Pin with Red Accent Ring (Exact like Reference Image 1) */}
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 transition-all duration-300 relative shadow-md ${
                    isSelected
                      ? "border-[#ea110d] ring-4 ring-[#ea110d]/20 scale-105"
                      : "border-white group-hover:border-[#ea110d] ring-2 ring-slate-900/10"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={place.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  {place.isFeatured && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-[#ea110d] rounded-full border border-white" />
                  )}
                </div>

                {/* Subtitle Pill Label underneath */}
                <div
                  className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white/95 text-slate-800 border-slate-200 group-hover:bg-slate-900 group-hover:text-white"
                  }`}
                >
                  {place.name.split(" ")[0]}
                </div>

                {/* Pin Tip Arrow */}
                <div
                  className={`w-2 h-2 rotate-45 -mt-1 ${
                    isSelected ? "bg-slate-900" : "bg-white border-r border-b border-slate-200"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── ACTIVE PLACE FLOATING CARD (Center-Bottom of Map - Exactly like Reference Image 1) ─── */}
      {selectedPlace && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[92%] sm:w-[420px] max-w-md animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto">
          <div className="bg-white/98 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-[0_16px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] p-3.5 sm:p-4">
            <div className="flex gap-3 sm:gap-4 items-start">
              {/* Place Thumbnail */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-slate-200/80 bg-slate-100">
                <img
                  src={
                    selectedPlace.coverImage ||
                    selectedPlace.images[0] ||
                    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"
                  }
                  alt={selectedPlace.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-slate-900/85 text-white backdrop-blur-xs">
                  {selectedPlace.category}
                </span>
              </div>

              {/* Place Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#ea110d] shrink-0" />
                  <span className="truncate">{selectedPlace.vicinity}</span>
                  {selectedPlace.altitude && (
                    <>
                      <span>•</span>
                      <span className="text-slate-600 font-semibold">{selectedPlace.altitude}</span>
                    </>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate mt-0.5 font-poppins">
                  {selectedPlace.name}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {selectedPlace.shortDescription}
                </p>

                {/* Key Spec Badges */}
                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-600">
                  {selectedPlace.timings && (
                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      {selectedPlace.timings.split("(")[0]}
                    </span>
                  )}
                  {selectedPlace.entryFee && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold">
                      {selectedPlace.entryFee.split("(")[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <Link
                href={`/explore/${selectedPlace.slug}`}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
              >
                <span>Explore Place Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>

              <a
                href={`https://www.google.com/maps?q=${selectedPlace.latitude},${selectedPlace.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                title="Get Directions in Google Maps"
              >
                <Compass className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Directions</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

