"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  Crosshair,
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

// Web Mercator projection helpers
function lng2tile(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom);
}

function lat2tile(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom);
}

function tile2lng(x: number, zoom: number): number {
  return (x / Math.pow(2, zoom)) * 360 - 180;
}

function tile2lat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

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
  const [zoom, setZoom] = useState(13);
  const [selectedPlace, setSelectedPlace] = useState<PlaceMarker | null>(null);

  // Drag-to-pan state with hardware-accelerated transform
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mapSize, setMapSize] = useState({ width: 1000, height: 600 });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Measure container dimensions dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setMapSize({
          width: containerRef.current.clientWidth || 1000,
          height: containerRef.current.clientHeight || 600,
        });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

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

  // Compute slippy tile grid
  const tileGrid = useMemo(() => {
    const { width, height } = mapSize;
    const centerTileX = lng2tile(center.lng, zoom);
    const centerTileY = lat2tile(center.lat, zoom);
    const maxTiles = Math.pow(2, zoom);

    const halfTilesW = width / 512 + 1.5;
    const halfTilesH = height / 512 + 1.5;

    const minX = Math.floor(centerTileX - halfTilesW);
    const maxX = Math.ceil(centerTileX + halfTilesW);
    const minY = Math.max(0, Math.floor(centerTileY - halfTilesH));
    const maxY = Math.min(maxTiles - 1, Math.ceil(centerTileY + halfTilesH));

    const tiles: Array<{
      key: string;
      url: string;
      fallbackUrl: string;
      left: number;
      top: number;
    }> = [];

    for (let ty = minY; ty <= maxY; ty++) {
      for (let tx = minX; tx <= maxX; tx++) {
        const wrappedX = ((tx % maxTiles) + maxTiles) % maxTiles;
        const left = (tx - centerTileX) * 256 + width / 2;
        const top = (ty - centerTileY) * 256 + height / 2;
        tiles.push({
          key: `${zoom}-${tx}-${ty}`,
          url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`,
          fallbackUrl: `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${wrappedX}/${ty}.png`,
          left,
          top,
        });
      }
    }

    return tiles;
  }, [center, zoom, mapSize]);

  // Convert GPS coordinates into pixel positions inside container
  const getMarkerPosition = (lat: number, lng: number) => {
    const centerTileX = lng2tile(center.lng, zoom);
    const centerTileY = lat2tile(center.lat, zoom);
    const mTileX = lng2tile(lng, zoom);
    const mTileY = lat2tile(lat, zoom);

    const left = (mTileX - centerTileX) * 256 + mapSize.width / 2;
    const top = (mTileY - centerTileY) * 256 + mapSize.height / 2;
    return { left, top };
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(16, z + 1));
  const handleZoomOut = () => setZoom((z) => Math.max(10, z - 1));
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
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("a")) return;
    setIsDragging(true);
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handleEndDrag = () => {
    if (!isDraggingRef.current) return;
    setIsDragging(false);
    isDraggingRef.current = false;

    setDragOffset((curr) => {
      if (curr.x !== 0 || curr.y !== 0) {
        const centerTileX = lng2tile(center.lng, zoom) - curr.x / 256;
        const centerTileY = lat2tile(center.lat, zoom) - curr.y / 256;
        const newLat = Math.min(85, Math.max(-85, tile2lat(centerTileY, zoom)));
        const newLng = Math.min(180, Math.max(-180, tile2lng(centerTileX, zoom)));
        setCenter({ lat: newLat, lng: newLng });
      }
      return { x: 0, y: 0 };
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleEndDrag}
      onMouseLeave={handleEndDrag}
      className={`relative w-full h-[580px] sm:h-[640px] lg:h-[700px] overflow-hidden select-none bg-[#e6ede8] ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      aria-label="Interactive Map of Famous Places in Mahabaleshwar"
    >
      {/* ─── BASE MAP LAYER: Smooth Slippy Tile Layer ────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none select-none will-change-transform"
        style={{
          transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
        }}
      >
        {tileGrid.map((tile) => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            width={256}
            height={256}
            loading="eager"
            decoding="async"
            className="absolute pointer-events-none select-none"
            style={{
              left: `${tile.left}px`,
              top: `${tile.top}px`,
              width: "256px",
              height: "256px",
            }}
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.fallback) {
                target.dataset.fallback = "true";
                target.src = tile.fallbackUrl;
              }
            }}
          />
        ))}
      </div>

      {/* ─── TOP & BOTTOM GRADIENT MASKS (Smoothly fades from navbar into map) ─── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.65) 15%, rgba(255,255,255,0.02) 35%, rgba(255,255,255,0.02) 70%, rgba(255,255,255,0.85) 92%, #ffffff 100%)",
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

      {/* Attribution */}
      <div className="absolute bottom-2 right-4 z-10 text-[10px] text-slate-500 bg-white/80 px-2 py-0.5 rounded backdrop-blur-xs pointer-events-none">
        &copy; <span className="font-semibold">OpenStreetMap</span> contributors
      </div>

      {/* ─── LIVE MARKER PINS ON MAP ───────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{
          transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
        }}
      >
        {displayedPlaces.map((place) => {
          const pos = getMarkerPosition(place.latitude, place.longitude);
          const isSelected = selectedPlace?.id === place.id;
          const imgUrl =
            place.coverImage ||
            place.images[0] ||
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80";

          // Avoid rendering outside visible screen area
          if (
            pos.left < -100 ||
            pos.left > mapSize.width + 100 ||
            pos.top < -100 ||
            pos.top > mapSize.height + 100
          ) {
            return null;
          }

          return (
            <div
              key={place.id}
              style={{ left: `${pos.left}px`, top: `${pos.top}px` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group transition-transform duration-150"
              onClick={() => handleMarkerClick(place)}
            >
              {/* Marker Container */}
              <div
                className={`relative flex flex-col items-center transition-transform duration-150 ${
                  isSelected ? "scale-115 z-30" : "scale-100 hover:scale-110 z-10"
                }`}
              >
                {/* Circular Image Pin with Red Accent Ring */}
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 transition-all duration-150 relative shadow-md ${
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
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── BOTTOM FLOATING DETAIL CARD (Selected Place) ───────────────────── */}
      {selectedPlace && (
        <div className="absolute bottom-6 left-4 sm:left-8 right-4 sm:right-auto z-20 pointer-events-auto max-w-md w-full animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white/98 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xl flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 relative bg-slate-100 border border-slate-100">
                  <Image
                    src={
                      selectedPlace.coverImage ||
                      selectedPlace.images[0] ||
                      "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
                    }
                    alt={selectedPlace.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea110d]">
                    {selectedPlace.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                    {selectedPlace.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{selectedPlace.vicinity}</span>
                    {selectedPlace.altitude && (
                      <span className="text-slate-400 font-medium">
                        • {selectedPlace.altitude}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {selectedPlace.shortDescription}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                {selectedPlace.timings || "Open Daily: Sunrise to Sunset"}
              </span>
              <Link
                href={`/explore/${selectedPlace.slug || selectedPlace.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#ea110d] hover:underline"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
