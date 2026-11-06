"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Tag,
  Star,
  ChevronLeft,
  ChevronRight,
  Compass,
  Mountain,
  Waves,
  Landmark,
  Sparkles,
  Calendar,
  Share2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
} from "lucide-react";
import api from "@/lib/api";

export interface PlaceDetail {
  id: string;
  name: string;
  slug: string;
  category: string;
  vicinity: string;
  shortDescription: string;
  description: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  altitude?: string | null;
  images: string[];
  coverImage?: string | null;
  timings?: string | null;
  entryFee?: string | null;
  bestTimeToVisit?: string | null;
  highlights: string[];
  tips: string[];
  isFeatured: boolean;
}

export default function PlaceDetailClient({ initialPlace, slug }: { initialPlace?: PlaceDetail | null; slug: string }) {
  const [place, setPlace] = useState<PlaceDetail | null>(initialPlace || null);
  const [loading, setLoading] = useState(!initialPlace);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!place && slug) {
      setLoading(true);
      api
        .get(`/places/${slug}`)
        .then((res) => {
          setPlace(res.data?.data || null);
        })
        .catch(() => {
          setPlace(null);
        })
        .finally(() => setLoading(false));
    }
  }, [slug, place]);

  const allImages = place?.images && place.images.length > 0
    ? place.images
    : place?.coverImage
    ? [place.coverImage]
    : ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"];

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center">
        <div className="py-40 text-center space-y-4">
          <div className="w-10 h-10 border-3 border-[#ea110d] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500 font-poppins">Loading place details...</p>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center">
        <div className="py-36 text-center max-w-md mx-auto px-4">
          <Compass className="w-14 h-14 text-slate-300 mx-auto mb-3 stroke-[1.5]" />
          <h2 className="text-xl font-bold text-slate-900 font-poppins">Landmark Not Found</h2>
          <p className="text-xs text-slate-500 mt-2">
            The attraction you are looking for may have been updated or moved.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-[#ea110d] text-white text-xs font-bold hover:bg-[#d00f0c] transition"
          >
            <span>Back to Explore Map</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#ea110d] selection:text-white">
      <main className="pt-24 sm:pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Breadcrumb ────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
          <Link href="/" className="hover:text-slate-900 transition">
            Home
          </Link>
          <span>/</span>
          <Link href="/explore" className="hover:text-slate-900 transition">
            Explore Places
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate max-w-xs">{place.name}</span>
        </nav>

        {/* ─── Place Title Header ───────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200/80">
                {place.category}
              </span>
              {place.isFeatured && (
                <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#ea110d] text-white">
                  Must Visit Landmark
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 font-poppins tracking-tight">
              {place.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600 mt-2 font-medium">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#ea110d] shrink-0" />
                <span>{place.vicinity}, Western Ghats</span>
              </div>
              {place.altitude && (
                <>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5">
                    <Mountain className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Altitude: <strong className="text-slate-800 font-semibold">{place.altitude}</strong></span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{copiedLink ? "Link Copied!" : "Share"}</span>
            </button>

            <a
              href={`https://www.google.com/maps?q=${place.latitude},${place.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs font-bold transition shadow-sm"
            >
              <Compass className="w-4 h-4" />
              <span>Google Maps Directions</span>
            </a>
          </div>
        </div>

        {/* ─── PHOTO GALLERY SECTION (All photos displayed cleanly) ── */}
        <section className="mt-8 space-y-4">
          {/* Main Large Photo Display */}
          <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden bg-slate-900 border border-slate-200/90 shadow-xs">
            <img
              src={allImages[activeImageIndex]}
              alt={`${place.name} Photo ${activeImageIndex + 1}`}
              loading={activeImageIndex === 0 ? "eager" : "lazy"}
              decoding="async"
              className="w-full h-full object-cover transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

            {/* Photo navigation arrows if multiple */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition cursor-pointer"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition cursor-pointer"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-xs">
                  {activeImageIndex + 1} / {allImages.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative w-24 sm:w-32 aspect-[16/10] rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    activeImageIndex === i
                      ? "border-[#ea110d] ring-2 ring-[#ea110d]/20 scale-102"
                      : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ─── QUICK ATTRIBUTES STRIP ─────────────────────────────────── */}
        <section className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Opening Timings
            </span>
            <div className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{place.timings || "6:00 AM – 6:30 PM"}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Entry Fee
            </span>
            <div className="text-xs sm:text-sm font-bold text-emerald-700 mt-0.5">
              {place.entryFee || "Free Entry"}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Best Season
            </span>
            <div className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{place.bestTimeToVisit || "October to May"}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Altitude Elevation
            </span>
            <div className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-slate-500" />
              <span>{place.altitude || "1,350 m"}</span>
            </div>
          </div>
        </section>

        {/* ─── MAIN CONTENT: About, Highlights, Tips ──────────────────── */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column (2 Cols): Overview & Highlights */}
          <div className="lg:col-span-2 space-y-10">
            {/* About & History */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-poppins tracking-tight mb-4">
                About {place.name}
              </h2>
              <div className="text-sm sm:text-base text-slate-700 leading-relaxed font-roboto space-y-4 whitespace-pre-line">
                {place.description}
              </div>
            </div>

            {/* Key Highlights */}
            {place.highlights && place.highlights.length > 0 && (
              <div className="p-6 rounded-3xl bg-slate-50/70 border border-slate-200/80">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 font-poppins mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ea110d]" />
                  <span>Key Highlights &amp; What to See</span>
                </h3>
                <ul className="space-y-2.5">
                  {place.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-[#ea110d] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Visitor Tips */}
            {place.tips && place.tips.length > 0 && (
              <div className="p-6 rounded-3xl border border-slate-200">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 font-poppins mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Practical Traveler Tips</span>
                </h3>
                <ul className="space-y-2.5">
                  {place.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Location Card & Nearby Stays */}
          <div className="space-y-6">
            {/* Location Map Widget */}
            <div className="rounded-3xl border border-slate-200 p-5 bg-white shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 font-poppins flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#ea110d]" />
                <span>Geographic Location</span>
              </h3>

              <div className="text-xs text-slate-600 space-y-1">
                {place.address && <p className="font-medium text-slate-800">{place.address}</p>}
                <p className="font-mono text-slate-400">
                  {place.latitude.toFixed(4)}° N, {place.longitude.toFixed(4)}° E
                </p>
              </div>

              {/* Static Mini Map Embed */}
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-200">
                <iframe
                  title="Place Mini Map"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${(place.longitude - 0.02).toFixed(4)}%2C${(place.latitude - 0.015).toFixed(4)}%2C${(place.longitude + 0.02).toFixed(4)}%2C${(place.latitude + 0.015).toFixed(4)}&layer=mapnik&marker=${place.latitude.toFixed(5)}%2C${place.longitude.toFixed(5)}`}
                  className="w-full h-full border-0 filter grayscale contrast-110"
                />
              </div>

              <a
                href={`https://www.google.com/maps?q=${place.latitude},${place.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-[#ea110d] text-white text-xs font-bold transition flex items-center justify-center gap-2 text-center"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
              </a>
            </div>

            {/* Nearby Stays Call-To-Action */}
            <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#ea110d]">
                <Building2 className="w-4 h-4" />
                <span>Stay Nearby</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-poppins">
                Visiting {place.name.split("(")[0]}?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stay at verified private pool villas and hillside resorts located just minutes from this attraction.
              </p>
              <Link
                href="/stays"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ea110d] hover:underline pt-1"
              >
                <span>Browse Nearby Stays &amp; Villas →</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

