"use client";

import React from "react";

export interface ActiveFilterItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onRemove: () => void;
}

interface NoMatchFoundProps {
  entityName?: "stays" | "packages" | "experiences" | string;
  title?: string;
  subtitle?: string;
  activeFilters?: ActiveFilterItem[];
  onResetAll: () => void;
  onModifyFilters?: () => void;
}

export default function NoMatchFound({
  entityName = "stays",
  title,
  subtitle,
  activeFilters = [],
  onResetAll,
  onModifyFilters,
}: NoMatchFoundProps) {
  const defaultSubtitle =
    entityName === "packages"
      ? "Try adjusting or clearing your filters to explore other curated holiday packages."
      : entityName === "experiences"
      ? "Try adjusting or clearing your filters to explore other curated outdoor adventures."
      : "Try adjusting or clearing your filters to explore other luxury accommodations.";

  const handleModify = () => {
    if (onModifyFilters) {
      onModifyFilters();
    } else {
      // Scroll to filter sidebar
      const sidebarEl =
        document.querySelector("aside") ||
        document.getElementById("catalog-section") ||
        document.getElementById("packages-catalog") ||
        document.getElementById("experiences-catalog");
      if (sidebarEl) {
        sidebarEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 sm:py-12 px-4 select-none">
      {/* ─── Top Active Filters Row ────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-8 sm:mb-10 text-xs sm:text-sm">
          <span className="font-semibold text-slate-700 mr-1">Active filters:</span>

          {activeFilters.map((filter) => (
            <div
              key={filter.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-[#ea110d] font-semibold text-xs shadow-2xs group"
            >
              {filter.icon ? (
                <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">
                  {filter.icon}
                </span>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5 shrink-0"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              )}
              <span className="capitalize">{filter.label}</span>
              <button
                type="button"
                onClick={filter.onRemove}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-rose-200/80 transition-colors ml-0.5 cursor-pointer"
                aria-label={`Remove filter ${filter.label}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3 h-3"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}

          {/* Reset All Action Button */}
          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#ea110d] hover:text-[#d00f0c] hover:underline transition-colors ml-1 cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Reset all</span>
          </button>
        </div>
      )}

      {/* ─── Center Hero Illustration (Exact Match to Reference) ─── */}
      <div className="relative w-full max-w-[500px] h-52 sm:h-64 mx-auto flex items-center justify-center">
        {/* Soft Ambient Radial Background Glow */}
        <div className="absolute inset-0 bg-radial from-rose-100/60 via-rose-50/25 to-transparent blur-2xl pointer-events-none" />

        <svg
          viewBox="0 0 520 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10"
        >
          <defs>
            {/* Soft Coral/Pink Sunset Sun Gradient */}
            <radialGradient id="sunsetSun" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fecdd3" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#fee2e2" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#fff1f2" stopOpacity="0" />
            </radialGradient>

            {/* Distant Hills Gradient */}
            <linearGradient id="hillGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="hillGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.6" />
            </linearGradient>

            {/* Villa Terracotta Roof Gradient */}
            <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ea110d" />
              <stop offset="100%" stopColor="#c01511" />
            </linearGradient>

            {/* Villa Side Wings Roof */}
            <linearGradient id="roofWing" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d1d5db" />
              <stop offset="100%" stopColor="#9ca3af" />
            </linearGradient>

            {/* Water Reflection Gradient */}
            <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fee2e2" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 1. Sunset Glowing Orb */}
          <circle cx="270" cy="115" r="75" fill="url(#sunsetSun)" />

          {/* 2. Soft Distant Mountains / Hills */}
          <path
            d="M 140 155 Q 185 110 230 155"
            fill="url(#hillGrad1)"
            opacity="0.75"
          />
          <path
            d="M 295 155 Q 345 118 395 155"
            fill="url(#hillGrad1)"
            opacity="0.65"
          />
          <path
            d="M 160 155 Q 195 128 230 155"
            fill="url(#hillGrad2)"
            opacity="0.6"
          />

          {/* 3. Flying Birds in Sky */}
          <path
            d="M 315 78 Q 319 74 323 78 Q 327 74 331 78"
            stroke="#94a3b8"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 313 90 Q 316 87 319 90 Q 322 87 325 90"
            stroke="#94a3b8"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />

          {/* 4. Island / Waterfront Shore Base */}
          <path
            d="M 195 152 C 220 148, 300 147, 345 152 C 340 157, 200 157, 195 152 Z"
            fill="#334155"
          />

          {/* 5. Luxury Villa Architecture */}
          {/* Main Central Building Walls */}
          <rect x="245" y="122" width="55" height="28" fill="#ffffff" />
          <rect x="250" y="126" width="10" height="24" fill="#64748b" opacity="0.35" />
          <rect x="264" y="126" width="18" height="24" fill="#334155" />
          <rect x="286" y="126" width="10" height="24" fill="#64748b" opacity="0.35" />

          {/* Left Wing */}
          <rect x="228" y="128" width="17" height="22" fill="#f8fafc" />
          <polygon points="225,128 248,128 245,123 228,123" fill="url(#roofWing)" />

          {/* Right Wing */}
          <rect x="300" y="128" width="17" height="22" fill="#f8fafc" />
          <polygon points="298,128 320,128 317,123 300,123" fill="url(#roofWing)" />

          {/* Main Red Terracotta Pitched Roof */}
          <polygon
            points="236,122 309,122 272.5,103"
            fill="url(#roofGrad)"
          />
          {/* Subtle Roof Eaves Highlight */}
          <line
            x1="234"
            y1="122"
            x2="311"
            y2="122"
            stroke="#b91c1c"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* 6. Surrounding Trees & Foliage */}
          {/* Tall Palm Tree (Left side) */}
          {/* Trunk */}
          <path
            d="M 230 152 Q 224 115 233 80"
            stroke="#1e293b"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Palm Fronds with Feathered Leaflets */}
          {/* Frond 1 (Top left) */}
          <path d="M 233 80 Q 212 68 198 82" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 226 73 L 221 78 M 220 73 L 214 80 M 212 75 L 206 83 M 204 78 L 199 84" stroke="#1e293b" strokeWidth="1.6" strokeLinecap="round" />

          {/* Frond 2 (Middle left - drooping) */}
          <path d="M 233 80 Q 206 82 201 100" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 224 81 L 220 89 M 216 83 L 211 92 M 209 87 L 204 96 M 204 93 L 200 99" stroke="#1e293b" strokeWidth="1.6" strokeLinecap="round" />

          {/* Frond 3 (Top right) */}
          <path d="M 233 80 Q 248 66 261 78" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 239 73 L 244 78 M 245 72 L 251 79 M 252 74 L 258 81 M 256 77 L 261 82" stroke="#1e293b" strokeWidth="1.6" strokeLinecap="round" />

          {/* Frond 4 (Middle right - drooping towards villa) */}
          <path d="M 233 80 Q 256 82 263 98" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 241 81 L 246 89 M 249 84 L 254 93 M 255 88 L 259 96 M 259 93 L 263 98" stroke="#1e293b" strokeWidth="1.6" strokeLinecap="round" />

          {/* Frond 5 (Crown crest) */}
          <path d="M 233 80 Q 230 60 236 58" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M 231 72 L 227 67 M 232 66 L 228 61 M 233 70 L 238 66 M 234 64 L 239 60" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />

          {/* Secondary Shrub / Little Palm at Base */}
          <circle cx="225" cy="148" r="8" fill="#334155" />
          <circle cx="236" cy="149" r="6" fill="#475569" />

          {/* Garden Trees on the Right */}
          <ellipse cx="321" cy="140" rx="3.5" ry="13" fill="#475569" />
          <ellipse cx="330" cy="143" rx="2.8" ry="9" fill="#64748b" />
          <circle cx="316" cy="149" r="6" fill="#334155" />
          <circle cx="337" cy="150" r="5" fill="#475569" />

          {/* 7. Lake Water Surface & Ripple Reflections */}
          {/* Inverted Soft Villa Reflection */}
          <g opacity="0.25" transform="scale(1, -0.55) translate(0, -320)">
            <polygon points="245,122 300,122 272.5,108" fill="#ea110d" opacity="0.6" />
            <rect x="250" y="122" width="45" height="15" fill="#94a3b8" opacity="0.4" />
          </g>

          <ellipse cx="270" cy="162" rx="65" ry="10" fill="url(#waterGrad)" />
          {/* Gentle Ripple Lines */}
          <line
            x1="225"
            y1="158"
            x2="315"
            y2="158"
            stroke="#e2e8f0"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="240"
            y1="164"
            x2="300"
            y2="164"
            stroke="#fed7aa"
            strokeWidth="1"
            strokeOpacity="0.6"
            strokeLinecap="round"
          />
          <line
            x1="255"
            y1="170"
            x2="285"
            y2="170"
            stroke="#fecdd3"
            strokeWidth="1"
            strokeOpacity="0.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ─── Typography: Heading & Subtitle ───────────────────── */}
      <div className="text-center mt-3 sm:mt-5">
        <h2 className="text-2xl sm:text-3xl md:text-[34px] font-extrabold text-slate-900 tracking-tight leading-tight font-poppins">
          {title ? (
            title
          ) : (
            <>
              No matching {entityName}{" "}
              <span className="text-[#ea110d]">found</span>
            </>
          )}
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto leading-relaxed mt-2.5 mb-7 sm:mb-8 font-roboto">
          {subtitle || defaultSubtitle}
        </p>

        {/* ─── Action Buttons: Reset All Filters + Modify Filters ─ */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {/* Primary Red Pill Button: Reset All Filters */}
          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 rounded-full bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs sm:text-sm font-bold shadow-[0_8px_22px_rgba(234,17,13,0.3)] hover:shadow-[0_10px_28px_rgba(234,17,13,0.42)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 group-hover:-rotate-90 transition-transform duration-300"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            <span>Reset All Filters</span>
          </button>

          {/* Secondary Outline Pill Button: Modify Filters */}
          <button
            type="button"
            onClick={handleModify}
            className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-slate-700"
            >
              <line x1="4" y1="8" x2="12" y2="8" />
              <line x1="16" y1="8" x2="20" y2="8" />
              <circle cx="14" cy="8" r="2" />
              <line x1="4" y1="16" x2="8" y2="16" />
              <line x1="12" y1="16" x2="20" y2="16" />
              <circle cx="10" cy="16" r="2" />
            </svg>
            <span>Modify Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}
