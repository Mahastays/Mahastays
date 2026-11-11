"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ZoomIn, ZoomOut, Crosshair, X, ArrowRight } from "lucide-react";
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

// Center of Mahabaleshwar & Panchgani region
const MAHABALESHWAR_CENTER = { lat: 17.9250, lng: 73.7400 };

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

function parseCoord(val: any): number | null {
  if (typeof val === "number" && !isNaN(val) && isFinite(val) && val !== 0) return val;
  if (typeof val === "string") {
    const n = parseFloat(val.trim());
    if (!isNaN(n) && isFinite(n) && n !== 0) return n;
  }
  return null;
}

// Extract real coordinates from Google Maps URLs (e.g. @17.92,73.65 or q=17.92,73.65)
function extractCoordsFromUrl(url?: string): { lat: number; lng: number } | null {
  if (!url || typeof url !== "string") return null;
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat > 15 && lat < 20 && lng > 70 && lng < 76) {
      return { lat, lng };
    }
  }
  const qMatch = url.match(/[?&](?:q|ll|query|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat > 15 && lat < 20 && lng > 70 && lng < 76) {
      return { lat, lng };
    }
  }
  return null;
}

export default function MahabaleshwarMapSection() {
  const dispatch = useAppDispatch();
  const properties = useAppSelector((state) => state.properties.items);
  const experiences = useAppSelector((state) => state.experiences.items);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Filter state: 'all' | 'stays' | 'experiences'
  const [activeFilter, setActiveFilter] = useState<"all" | "stays" | "experiences">("all");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Map state (zoom level 12 comfortably fits both Mahabaleshwar and Panchgani simultaneously)
  const [center, setCenter] = useState(MAHABALESHWAR_CENTER);
  const [zoom, setZoom] = useState(12);
  const [mapSize, setMapSize] = useState({ width: 1000, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    dispatch(fetchProperties());
    dispatch(fetchExperiences());
  }, [dispatch]);

  // Track map container dimensions dynamically
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const updateSize = () => {
      if (mapContainerRef.current) {
        setMapSize({
          width: mapContainerRef.current.clientWidth || 1000,
          height: mapContainerRef.current.clientHeight || 600,
        });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(mapContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // Transform actual database properties and experiences using their exact latitude and longitude
  const allPlaces: MapPlaceItem[] = useMemo(() => {
    const list: MapPlaceItem[] = [];
    const usedCoordSlots = new Map<string, number>();

    // Helper to resolve coordinates for stays using real latitude and longitude
    const resolveStayCoords = (prop: any, idx: number) => {
      // 1. Check if real custom coordinates are stored in DB (not the default town placeholder)
      const candidates: Array<[any, any]> = [
        [prop.address?.lat, prop.address?.lng],
        [prop.mapCoordinates?.lat, prop.mapCoordinates?.lng],
        [prop.coordinates?.lat, prop.coordinates?.lng],
        [prop.latitude, prop.longitude],
        [prop.lat, prop.lng],
      ];

      for (const [rawLat, rawLng] of candidates) {
        const lat = parseCoord(rawLat);
        const lng = parseCoord(rawLng);
        if (lat !== null && lng !== null) {
          // If vendor saved distinct non-default coordinates, trust them directly
          const isGenericPlaceholder =
            Math.abs(lat - 17.9237) < 0.0005 && Math.abs(lng - 73.6586) < 0.0005;
          if (!isGenericPlaceholder) {
            return { lat, lng };
          }
        }
      }

      // 2. Check if a real Google Maps link contains exact coordinates
      const fromUrl =
        extractCoordsFromUrl(prop.address?.mapLink) ||
        extractCoordsFromUrl(prop.mapLink) ||
        extractCoordsFromUrl(prop.address?.fullAddress);
      if (fromUrl) {
        return fromUrl;
      }

      // 3. Resolve by known neighborhood / address text in Mahabaleshwar & Panchgani
      const text = `${prop.name || ""} ${prop.location || ""} ${prop.address?.fullAddress || ""} ${prop.address?.mapLink || ""} ${prop.city || ""}`.toLowerCase();

      if (text.includes("mapro") || text.includes("gureghar")) {
        return { lat: 17.9255, lng: 73.7820 };
      }
      if (text.includes("panchgani") || text.includes("ambral") || text.includes("khingar") || text.includes("iconic")) {
        return { lat: 17.9215, lng: 73.8150 };
      }
      if (text.includes("lingmala") || text.includes("metgutad") || text.includes("breeze mount")) {
        return { lat: 17.9280, lng: 73.7020 };
      }
      if (text.includes("ranjanvadi") || text.includes("jungle book")) {
        return { lat: 17.9380, lng: 73.6620 };
      }
      if (text.includes("venna")) {
        return { lat: 17.9290, lng: 73.6740 };
      }
      if (text.includes("table land")) {
        return { lat: 17.9242, lng: 73.8015 };
      }
      if (text.includes("bhilar")) {
        return { lat: 17.9150, lng: 73.7900 };
      }
      if (text.includes("bhekavali")) {
        return { lat: 17.9150, lng: 73.6850 };
      }
      if (text.includes("arthur")) {
        return { lat: 17.9850, lng: 73.6180 };
      }
      if (text.includes("kate")) {
        return { lat: 17.9333, lng: 73.6933 };
      }
      if (text.includes("tapola")) {
        return { lat: 17.8200, lng: 73.7120 };
      }
      if (text.includes("avkali") || text.includes("avakali")) {
        return { lat: 17.9270, lng: 73.7180 };
      }
      if (text.includes("swara")) {
        return { lat: 17.9237, lng: 73.6586 };
      }

      // Fallback coordinate distributed across the scenic valley
      return {
        lat: 17.9250 + (((idx * 7) % 9) - 4) * 0.0035,
        lng: 73.7300 + (((idx * 11) % 9) - 4) * 0.0055,
      };
    };

    // Helper to resolve coordinates for experiences using real latitude and longitude
    const resolveExpCoords = (exp: any, idx: number) => {
      const candidates: Array<[any, any]> = [
        [exp.coordinates?.lat, exp.coordinates?.lng],
        [exp.mapCoordinates?.lat, exp.mapCoordinates?.lng],
        [exp.address?.lat, exp.address?.lng],
        [exp.latitude, exp.longitude],
        [exp.lat, exp.lng],
      ];

      for (const [rawLat, rawLng] of candidates) {
        const lat = parseCoord(rawLat);
        const lng = parseCoord(rawLng);
        if (lat !== null && lng !== null) {
          const isGenericPlaceholder =
            Math.abs(lat - 17.9237) < 0.0005 && Math.abs(lng - 73.6586) < 0.0005;
          if (!isGenericPlaceholder) {
            return { lat, lng };
          }
        }
      }

      const fromUrl =
        extractCoordsFromUrl(exp.meetingPoint) ||
        extractCoordsFromUrl(exp.mapLink) ||
        extractCoordsFromUrl(exp.address?.mapLink);
      if (fromUrl) {
        return fromUrl;
      }

      const text = `${exp.title || ""} ${exp.name || ""} ${exp.meetingPoint || ""} ${exp.city || ""}`.toLowerCase();
      if (text.includes("trek") || text.includes("arthur") || text.includes("tracking")) {
        return { lat: 17.9420, lng: 73.6820 };
      }
      if (text.includes("boat") || text.includes("venna")) {
        return { lat: 17.9310, lng: 73.6760 };
      }
      if (text.includes("paraglid") || text.includes("panchgani")) {
        return { lat: 17.9280, lng: 73.8050 };
      }
      if (text.includes("strawberry") || text.includes("farm") || text.includes("mapro")) {
        return { lat: 17.9265, lng: 73.7850 };
      }

      return {
        lat: 17.9300 + (((idx * 9) % 9) - 4) * 0.0035,
        lng: 73.7400 + (((idx * 11) % 9) - 4) * 0.0055,
      };
    };

    // Spidering anti-collision dispatcher so each place gets its own unique, visible marker
    const getAntiCollisionCoords = (rawLat: number, rawLng: number) => {
      const slotKey = `${rawLat.toFixed(3)},${rawLng.toFixed(3)}`;
      const collisionCount = usedCoordSlots.get(slotKey) || 0;
      usedCoordSlots.set(slotKey, collisionCount + 1);

      if (collisionCount === 0) {
        return { lat: rawLat, lng: rawLng };
      }

      // Radial offset dispersing multiple pins in the same vicinity
      const angle = (collisionCount * 2 * Math.PI) / 6;
      const radius = 0.0032;
      return {
        lat: rawLat + Math.cos(angle) * radius,
        lng: rawLng + Math.sin(angle) * (radius * 1.25),
      };
    };

    // 1. Stays from API
    properties.forEach((prop, idx) => {
      const rawCoords = resolveStayCoords(prop, idx);
      const coords = getAntiCollisionCoords(rawCoords.lat, rawCoords.lng);
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
      const rawCoords = resolveExpCoords(exp, idx);
      const coords = getAntiCollisionCoords(rawCoords.lat, rawCoords.lng);
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

  // Generate hardware-accelerated slippy map tile grid
  const tileGrid = useMemo(() => {
    const { width, height } = mapSize;
    const centerTileX = lng2tile(center.lng, zoom);
    const centerTileY = lat2tile(center.lat, zoom);
    const maxTiles = Math.pow(2, zoom);

    // Render viewport tiles plus extra 1.5 tiles buffer on each side for butter-smooth panning
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

  // Calculate screen position for a marker based on exact latitude and longitude
  const getMarkerPosition = (lat: number, lng: number) => {
    const centerTileX = lng2tile(center.lng, zoom);
    const centerTileY = lat2tile(center.lat, zoom);
    const mTileX = lng2tile(lng, zoom);
    const mTileY = lat2tile(lat, zoom);

    const left = (mTileX - centerTileX) * 256 + mapSize.width / 2;
    const top = (mTileY - centerTileY) * 256 + mapSize.height / 2;
    const isNearTop = top < 160;

    return { left, top, isNearTop };
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(16, z + 1));
  const handleZoomOut = () => setZoom((z) => Math.max(10, z - 1));
  const handleResetCenter = () => {
    setCenter(MAHABALESHWAR_CENTER);
    setZoom(12);
  };

  // Dragging event handlers with smooth CSS translation
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

  // Touch event handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("a")) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const staysCount = allPlaces.filter((p) => p.category === "stay").length;
  const expCount = allPlaces.filter((p) => p.category === "experience").length;

  return (
    <section className="w-full pt-8 sm:pt-12 pb-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="destination-map">
      {/* ─── Header: Clean, Professional Layout ────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-[#ea110d] animate-pulse" />
            <span>Interactive Destination Map</span>
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

      {/* ─── Ultra-Smooth Slippy Map Container ───────────────────────────────── */}
      <div
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEndDrag}
        onMouseLeave={handleEndDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEndDrag}
        className={`relative w-full h-[520px] sm:h-[580px] lg:h-[620px] rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-[#e6ede8] select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        aria-label="Mahabaleshwar Regional Map"
      >
        {/* Hardware-Accelerated Interactive Tile Layer */}
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

        {/* Map Controls: Zoom In / Zoom Out / Reset Center */}
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

        {/* Attribution Notice */}
        <div className="absolute bottom-1 right-2 z-10 text-[10px] text-slate-500 bg-white/80 px-2 py-0.5 rounded backdrop-blur-xs pointer-events-none">
          Report a problem | &copy; <span className="font-semibold">OpenStreetMap</span> contributors
        </div>

        {/* ─── LIVE MARKER PINS ON MAP ─────────────────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none will-change-transform"
          style={{
            transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
          }}
        >
          {displayedPlaces.map((place) => {
            const pos = getMarkerPosition(place.lat, place.lng);
            const isSelected = activeItemId === place.id;
            const isStay = place.category === "stay";

            // Only render markers reasonably near the viewport
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
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group transition-transform duration-150 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveItemId(isSelected ? null : place.id);
                }}
              >
                <div
                  className={`relative flex flex-col items-center transition-transform duration-150 ${
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
          const isStay = activeItem.category === "stay";

          return (
            <div
              className="absolute inset-0 pointer-events-none z-30"
              style={{
                transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
              }}
            >
              {/* DESKTOP & TABLET FLOATING MINI-CARD (Near Clicked Pin) */}
              <div
                style={{
                  left: `${pos.left}px`,
                  top: `${pos.top}px`,
                }}
                className={`hidden sm:block absolute pointer-events-auto transition-all duration-150 -translate-x-1/2 ${
                  pos.isNearTop ? "mt-7" : "-translate-y-full -mt-7"
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
                  {pos.isNearTop ? (
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-l border-t border-slate-200" />
                  ) : (
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-slate-200" />
                  )}
                </div>
              </div>

              {/* MOBILE DOCKED MINI-CARD (Bottom of Map) */}
              <div className="sm:hidden absolute bottom-3 left-3 right-3 pointer-events-auto animate-in slide-in-from-bottom-2 fade-in duration-200">
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
            </div>
          );
        })()}
      </div>
    </section>
  );
}
