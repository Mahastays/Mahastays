"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProperties } from "@/store/slices/propertyslice";
import { fetchExperiences } from "@/store/slices/experienceslice";

interface MapPlace {
  id: string;
  name: string;
  type: "Hotel" | "Resort" | "Villa" | "Viewpoint" | "Experience" | "Adventure";
  location: string;
  image: string;
  price: string;
  savedTag: string;
  rating: number;
  specs: {
    sqft: string;
    beds: string;
    baths: string;
  };
  href: string;
  x: number; // Percentage X on map
  y: number; // Percentage Y on map
  isPopular?: boolean;
}

export default function MahabaleshwarMapSection() {
  const dispatch = useAppDispatch();
  const properties = useAppSelector((state) => state.properties.items);
  const experiences = useAppSelector((state) => state.experiences.items);
  const loading = useAppSelector((state) => state.properties.loading);

  useEffect(() => {
    dispatch(fetchProperties());
    dispatch(fetchExperiences());
  }, [dispatch]);

  // Transform actual database properties and experiences into interactive map places
  const places: MapPlace[] = useMemo(() => {
    const list: MapPlace[] = [];

    // Map landmark anchor locations across the Mahabaleshwar SVG canvas
    const anchors = [
      { x: 50, y: 56 }, // Venna Lake
      { x: 78, y: 42 }, // Panchgani Valley / Table Land
      { x: 22, y: 40 }, // Arthur's Seat
      { x: 32, y: 68 }, // Kate's Point
      { x: 68, y: 72 }, // Old Mahabaleshwar / Lingmala
    ];

    let anchorIdx = 0;

    // 1. Map live Properties from Database
    properties.forEach((prop) => {
      let x = anchors[anchorIdx % anchors.length].x;
      let y = anchors[anchorIdx % anchors.length].y;
      anchorIdx++;

      const locLower = (
        prop.location ||
        prop.serviceableLocation ||
        prop.city ||
        ""
      ).toLowerCase();

      if (locLower.includes("venna")) {
        x = 50;
        y = 56;
      } else if (locLower.includes("panchgani") || locLower.includes("table")) {
        x = 78;
        y = 42;
      } else if (locLower.includes("arthur") || locLower.includes("savitri")) {
        x = 22;
        y = 40;
      } else if (locLower.includes("kate") || locLower.includes("krishna")) {
        x = 32;
        y = 68;
      } else if (
        locLower.includes("old") ||
        locLower.includes("lingmala") ||
        locLower.includes("market")
      ) {
        x = 68;
        y = 72;
      }

      const imgUrl =
        typeof prop.images?.[0] === "string"
          ? prop.images[0]
          : prop.images?.[0]?.url ||
            prop.gallery?.[0] ||
            "https://images.unsplash.com/photo-1566073771259-6a8506099945";

      const firstRoom = prop.rooms?.[0];
      const sqft = firstRoom?.size
        ? `${firstRoom.size}`
        : prop.propertyType === "villa"
        ? "4,200 sq.ft."
        : "5-Acre Resort";
      const beds =
        firstRoom?.bed ||
        (prop.rooms && prop.rooms.length > 0
          ? `${prop.rooms.length} Bedroom`
          : "Private Pool");
      const baths =
        prop.amenities?.[0]?.name ||
        (prop.propertyType === "villa" ? "Private BBQ" : "Lake View");

      list.push({
        id: prop.id || prop._id,
        name: prop.name,
        type: prop.propertyType === "villa" ? "Villa" : "Resort",
        location:
          prop.address?.fullAddress ||
          prop.location ||
          "Mahabaleshwar, Maharashtra",
        image: imgUrl,
        price: `₹${(prop.numericPrice || prop.inrPrice || 5500).toLocaleString(
          "en-IN"
        )}`,
        savedTag:
          prop.badge ||
          prop.tags?.[0] ||
          (prop.propertyType === "villa" ? "Private Villa" : "Luxury Resort"),
        rating: Number(prop.rating) || 4.8,
        specs: { sqft, beds, baths },
        href: `/stay/${prop.id || prop._id}`,
        x,
        y,
        isPopular: true,
      });
    });

    // 2. Map live Experiences from Database
    experiences.forEach((exp) => {
      let x = anchors[anchorIdx % anchors.length].x;
      let y = anchors[anchorIdx % anchors.length].y;
      anchorIdx++;

      const titleLower = (exp.title || exp.name || "").toLowerCase();
      if (titleLower.includes("arthur") || titleLower.includes("trek")) {
        x = 22;
        y = 40;
      } else if (titleLower.includes("venna") || titleLower.includes("boat")) {
        x = 68;
        y = 72;
      } else if (
        titleLower.includes("paraglid") ||
        titleLower.includes("panchgani")
      ) {
        x = 32;
        y = 68;
      }

      const imgUrl =
        exp.image ||
        (Array.isArray(exp.gallery) && exp.gallery[0]) ||
        "https://images.unsplash.com/photo-1551632811-561732d1e306";

      list.push({
        id: exp.id || exp._id,
        name: exp.title || exp.name,
        type: "Experience",
        location:
          exp.meetingPoint || `${exp.city || "Mahabaleshwar"}, Maharashtra`,
        image: imgUrl,
        price: `₹${(exp.numericPrice || 350).toLocaleString("en-IN")}`,
        savedTag: exp.category || "Adventure",
        rating: Number(exp.rating) || Number(exp.ratingScore) || 4.8,
        specs: {
          sqft: exp.duration || "2 Hours Trail",
          beds: exp.groupSize || "Small Group",
          baths: exp.difficulty || "Certified Guide",
        },
        href: `/experiences/${exp.id || exp._id}`,
        x,
        y,
        isPopular: false,
      });
    });

    return list;
  }, [properties, experiences]);

  const [activePlaceId, setActivePlaceId] = useState<string>("");

  useEffect(() => {
    if (
      places.length > 0 &&
      (!activePlaceId || !places.some((p) => p.id === activePlaceId))
    ) {
      setActivePlaceId(places[0].id);
    }
  }, [places, activePlaceId]);

  const activePlace =
    places.find((p) => p.id === activePlaceId) || places[0];

  return (
    <section className="w-full  pt-10 sm:pt-14 pb-4 ">
      {/* ─── Map Header ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2 font-roboto">
            <span className="w-2 h-2 rounded-full bg-[#ea110d] animate-pulse" />
            <span>Interactive Destination Map</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight">
            Explore Mahabaleshwar &amp; Handpicked Stays
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 font-roboto max-w-xl">
            Click on map pins across Sahyadri peaks, Venna Lake, and strawberry valleys to preview verified luxury estates.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center sm:justify-end gap-3 text-xs font-semibold text-slate-600 font-roboto">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ea110d]" /> Popular Villa
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800" /> Luxury Resort
          </span>
        </div>
      </div>

      {/* ─── Black & White Map Container (Exact Screenshot Style) ────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative w-full h-[540px] sm:h-[620px] lg:h-[680px] rounded-3xl overflow-hidden border border-slate-200 shadow-[0_12px_45px_rgba(0,0,0,0.08)] bg-[#f4f4f4]">
          {/* Black & White Architectural Stylized Map Canvas / SVG */}
          <div className="absolute inset-0 select-none pointer-events-none opacity-90 overflow-hidden bg-[#fafafa]">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Street Grid Pattern */}
                <pattern
                  id="bw-grid"
                  width="80"
                  height="80"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 80 0 L 0 0 0 80"
                    fill="none"
                    stroke="#e8e8e8"
                    strokeWidth="1"
                  />
                  <path
                    d="M 40 0 L 40 80 M 0 40 L 80 40"
                    fill="none"
                    stroke="#f0f0f0"
                    strokeWidth="0.5"
                  />
                </pattern>
                {/* Topographic Lines Pattern */}
                <pattern
                  id="topo-lines"
                  width="160"
                  height="160"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M0 40 Q 40 10, 80 40 T 160 40"
                    fill="none"
                    stroke="#eaeaea"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M0 100 Q 50 70, 100 100 T 160 100"
                    fill="none"
                    stroke="#eaeaea"
                    strokeWidth="1.2"
                  />
                </pattern>
              </defs>

              {/* Base background fills */}
              <rect width="100%" height="100%" fill="#f8f9fa" />
              <rect width="100%" height="100%" fill="url(#bw-grid)" />
              <rect width="100%" height="100%" fill="url(#topo-lines)" opacity="0.6" />

              {/* Mountain contour shapes (Black & White grayscale) */}
              <path
                d="M-50,200 Q200,80 500,220 T1000,160 L1250,300 L1250,-50 L-50,-50 Z"
                fill="#f1f3f5"
              />
              <path
                d="M100,750 Q450,550 800,680 T1300,600 L1300,850 L100,850 Z"
                fill="#f1f3f5"
              />

              {/* Venna Lake & Koyna Water Body (Soft grayscale water) */}
              <path
                d="M 420,380 C 470,360 520,370 560,400 C 600,430 630,470 650,510 C 620,530 580,520 540,510 C 480,490 440,440 420,380 Z"
                fill="#e4e7eb"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              <text
                x="540"
                y="450"
                fill="#94a3b8"
                fontSize="13"
                fontWeight="700"
                fontFamily="Poppins"
                textAnchor="middle"
                opacity="0.8"
                letterSpacing="1"
              >
                VENNA LAKE
              </text>

              {/* Major Arterial Roads & Highways (Mahabaleshwar - Panchgani Ghats) */}
              <path
                d="M-50,420 C200,420 350,360 500,380 C 650,400 800,480 1250,440"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M-50,420 C200,420 350,360 500,380 C 650,400 800,480 1250,440"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Secondary Ghat Roads */}
              <path
                d="M 280,-20 C 310,180 390,300 500,380 C 560,430 580,620 620,820"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="4"
              />
              <path
                d="M 280,-20 C 310,180 390,300 500,380 C 560,430 580,620 620,820"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
              />

              {/* Kate's Point connecting road */}
              <path
                d="M 500,380 C 620,340 760,330 920,310 C 1040,290 1150,220 1250,200"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="3"
                strokeDasharray="4 2"
              />
              <path
                d="M 320,680 C 440,640 500,560 540,510 C 600,450 780,480 940,540"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="3"
              />

              {/* Place Names & Landmarks on the map */}
              <text x="280" y="240" fill="#64748b" fontSize="12" fontWeight="600" fontFamily="Roboto">
                Arthur&apos;s Seat
              </text>
              <text x="860" y="280" fill="#64748b" fontSize="12" fontWeight="600" fontFamily="Roboto">
                Panchgani Valley
              </text>
              <text x="310" y="590" fill="#64748b" fontSize="12" fontWeight="600" fontFamily="Roboto">
                Kate&apos;s Point
              </text>
              <text x="820" y="580" fill="#64748b" fontSize="12" fontWeight="600" fontFamily="Roboto">
                Old Mahabaleshwar
              </text>
              <text x="140" y="440" fill="#64748b" fontSize="12" fontWeight="600" fontFamily="Roboto">
                Elephant&apos;s Head
              </text>
              <text x="600" y="760" fill="#475569" fontSize="14" fontWeight="800" fontFamily="Poppins" letterSpacing="2">
                MAHABALESHWAR
              </text>
            </svg>
          </div>

          {/* ─── Interactive Pins ────────────────────────────────────── */}
          {places.map((place) => {
            const isSelected = place.id === activePlaceId;
            return (
              <div
                key={place.id}
                style={{ left: `${place.x}%`, top: `${place.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              >
                {/* Clickable Pin Button */}
                <button
                  type="button"
                  onClick={() => setActivePlaceId(place.id)}
                  aria-label={`View ${place.name}`}
                  className={`relative p-1 rounded-full bg-white shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition-all duration-300 cursor-pointer group hover:scale-115 ${
                    isSelected
                      ? "ring-4 ring-[#ea110d]/30 scale-110"
                      : "hover:ring-2 hover:ring-slate-300"
                  }`}
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-white relative">
                    <Image
                      src={place.image}
                      alt={place.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>

                  {/* Red/Black Indicator Dot */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-sm ${
                      isSelected
                        ? "bg-[#ea110d]"
                        : "bg-slate-900 group-hover:bg-[#ea110d]"
                    }`}
                  >
                    ★
                  </div>
                </button>
              </div>
            );
          })}

          {/* ─── Active Floating Property Card (Matching Screenshot Popover) ─── */}
          {activePlace && (() => {
            const isNearTop = activePlace.y < 50;
            const xShift =
              activePlace.x < 30
                ? "-translate-x-[22%]"
                : activePlace.x > 70
                ? "-translate-x-[78%]"
                : "-translate-x-1/2";
            const yShift = isNearTop
              ? "translate-y-4"
              : "-translate-y-[106%]";

            return (
              <div
                style={{
                  left: `${activePlace.x}%`,
                  top: `${activePlace.y}%`,
                }}
                className={`absolute ${xShift} ${yShift} z-30 w-[300px] sm:w-[340px] pointer-events-auto transition-all duration-300 ease-out animate-in fade-in zoom-in-95`}
              >
                <div className="bg-white rounded-[22px] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.22)] border border-slate-100 relative">
                  {/* Property Image with Badge */}
                  <div className="relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden mb-2.5">
                    <Image
                      src={activePlace.image}
                      alt={activePlace.name}
                      fill
                      className="object-cover"
                      sizes="340px"
                    />
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-extrabold text-slate-800 shadow-sm font-poppins">
                      {activePlace.savedTag}
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1 font-roboto">
                      <span className="text-amber-400">★</span> {activePlace.rating}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="px-1 pb-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-1 font-poppins">
                      {activePlace.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-0.5 mb-2 font-roboto">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        className="text-[#ea110d]"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="truncate">{activePlace.location}</span>
                    </div>

                    {/* Specs: sqft, bed, bath */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold py-1.5 px-2 rounded-xl bg-slate-50 mb-3 font-roboto">
                      <span>📐 {activePlace.specs.sqft}</span>
                      <span>🛏️ {activePlace.specs.beds}</span>
                      <span>🚿 {activePlace.specs.baths}</span>
                    </div>

                    {/* Price and CTA Button */}
                    <div className="flex items-center justify-between pt-0.5">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base sm:text-lg font-black text-slate-900 font-poppins">
                            {activePlace.price}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium font-roboto">
                            /night
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 font-roboto">
                          Verified Rate
                        </span>
                      </div>

                      <Link
                        href={activePlace.href}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f70200] to-[#d40806] hover:from-[#d40806] hover:to-[#b80604] text-white text-xs font-bold shadow-[0_4px_14px_rgba(234,17,13,0.35)] transition-all hover:scale-105 active:scale-95 font-poppins"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>

                  {/* Arrow Pointer under or above card */}
                  {isNearTop ? (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-slate-100" />
                  ) : (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-slate-100" />
                  )}
                </div>

                {/* Pin Target Ring (Matching screenshot 20/M badge) */}
                <div
                  className={`w-7 h-7 mx-auto rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shadow-lg ring-4 ring-white font-poppins ${
                    isNearTop ? "-mt-10 mb-2" : "mt-2"
                  }`}
                >
                  20
                </div>
              </div>
            );
          })()}

          {/* Quick Navigation Controls in Bottom Right of Map */}
          {activePlace && (
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-bold text-slate-700 font-poppins">
              <span className="text-slate-400">Viewing:</span>
              <span className="text-[#ea110d]">{activePlace.name?.split(" ")[0] || activePlace.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Stats Bar Row (Light and Clean Typography Matching Screenshot) ───── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 text-center md:text-left">
          {/* Stat 1 */}
          <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 tracking-tight font-poppins">
              ₹12Cr+
            </span>
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-500 font-roboto">
              TOTAL<br className="hidden md:inline" /> BOOKINGS
            </span>
          </div>

          {/* Stat 2 */}
          <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 tracking-tight font-poppins">
              45K+
            </span>
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-500 font-roboto">
              HAPPY<br className="hidden md:inline" /> GUESTS
            </span>
          </div>

          {/* Stat 3 */}
          <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 tracking-tight font-poppins">
              {properties.length > 0 ? `${properties.length}+` : "150+"}
            </span>
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-500 font-roboto">
              VERIFIED<br className="hidden md:inline" /> STAYS
            </span>
          </div>

          {/* Stat 4 */}
          <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 tracking-tight font-poppins">
              4.9★
            </span>
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-500 font-roboto">
              AVERAGE<br className="hidden md:inline" /> RATING
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
