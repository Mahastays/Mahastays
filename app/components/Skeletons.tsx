import React from "react";

// ─── 1. Stay Card Skeleton (Light Theme) ─────────────────────
export function StayCardSkeleton() {
  return (
    <div className="bg-white rounded-[26px] overflow-hidden flex flex-col border border-slate-200/90 shadow-sm h-full w-full max-w-[420px] mx-auto sm:mx-0 animate-pulse">
      {/* Top Image Shimmer */}
      <div className="w-full h-56 sm:h-60 relative overflow-hidden bg-slate-200">
        <div className="w-full h-full animate-shimmer" />
        <div className="absolute top-3.5 left-3.5 w-24 h-6 rounded-full bg-slate-300/80" />
        <div className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-300/80 shadow-xs" />
        {/* Soft bottom white gradient blend */}
        <div className="absolute inset-x-0 bottom-0 h-20 sm:h-24 pointer-events-none bg-gradient-to-t from-white via-white/70 via-35% to-transparent" />
      </div>

      {/* Content Area Shimmer */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-4 bg-white">
        <div className="space-y-2.5">
          {/* Title & Price placeholder */}
          <div className="flex items-start justify-between gap-2">
            <div className="h-5 bg-slate-300 rounded-lg w-2/3 animate-shimmer" />
            <div className="h-6 bg-slate-200 rounded-full w-20 animate-shimmer" />
          </div>

          {/* Description line placeholders */}
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 bg-slate-200 rounded w-full" />
            <div className="h-3.5 bg-slate-200 rounded w-4/5" />
          </div>

          {/* Tag Pills */}
          <div className="flex items-center gap-1.5 pt-2">
            <div className="h-5 w-16 bg-slate-200 rounded-full" />
            <div className="h-5 w-20 bg-slate-200 rounded-full" />
            <div className="h-5 w-14 bg-slate-200 rounded-full" />
          </div>
        </div>

        {/* Bottom CTA Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="h-4 w-16 bg-slate-200 rounded" />
          <div className="h-9 w-28 bg-[#ea110d]/40 rounded-full animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

// ─── 2. Package Card Skeleton ────────────────────────────────
export function PackageCardSkeleton() {
  return (
    <div className="bg-white rounded-[26px] overflow-hidden flex flex-col border border-slate-200/90 shadow-sm h-full animate-pulse">
      {/* Top Image Shimmer */}
      <div className="w-full h-52 sm:h-56 relative overflow-hidden bg-slate-200">
        <div className="w-full h-full animate-shimmer" />
        <div className="absolute top-3.5 left-3.5 w-28 h-6 rounded-full bg-slate-300/80" />
      </div>

      {/* Content Area Shimmer */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-200 rounded w-1/3 animate-shimmer" />
            <div className="h-4 bg-amber-100 rounded w-16 animate-shimmer" />
          </div>

          <div className="h-6 bg-slate-300 rounded-lg w-4/5 animate-shimmer" />

          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 bg-slate-200 rounded w-full" />
            <div className="h-3.5 bg-slate-200 rounded w-3/4" />
          </div>
        </div>

        {/* Bottom Price & Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="h-3 bg-slate-200 rounded w-12" />
            <div className="h-5 bg-slate-300 rounded w-20 animate-shimmer" />
          </div>
          <div className="h-9 w-28 bg-slate-900/30 rounded-xl animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

// ─── 3. Experience Card Skeleton ─────────────────────────────
export function ExperienceCardSkeleton() {
  return (
    <div className="bg-white rounded-[26px] overflow-hidden flex flex-col border border-slate-200/90 shadow-sm h-full animate-pulse">
      {/* Top Image Shimmer */}
      <div className="w-full h-52 sm:h-56 relative overflow-hidden bg-slate-200">
        <div className="w-full h-full animate-shimmer" />
        <div className="absolute top-3.5 left-3.5 w-20 h-6 rounded-full bg-slate-300/80" />
        <div className="absolute bottom-3 left-3 w-32 h-6 rounded-full bg-slate-300/70" />
      </div>

      {/* Content Area Shimmer */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-4 bg-amber-100 rounded w-14" />
          </div>

          <div className="h-6 bg-slate-300 rounded-lg w-5/6 animate-shimmer" />

          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 bg-slate-200 rounded w-full" />
            <div className="h-3.5 bg-slate-200 rounded w-2/3" />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="h-3 bg-slate-200 rounded w-14" />
            <div className="h-5 bg-slate-300 rounded w-20 animate-shimmer" />
          </div>
          <div className="h-9 w-28 bg-[#ea110d]/40 rounded-xl animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

// ─── 4. Full Detail Page Skeleton (Package, Experience, Stay) ─
export function DetailPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-roboto animate-pulse">
      <main className="flex-1 pt-28 sm:pt-32 lg:pt-36 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumb shimmer */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-16 bg-slate-200 rounded" />
          <span className="text-slate-300">/</span>
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <span className="text-slate-300">/</span>
          <div className="h-4 w-40 bg-slate-300 rounded animate-shimmer" />
        </div>

        {/* Title & Eyebrow shimmer */}
        <div className="mb-6 space-y-2">
          <div className="h-4 w-32 bg-red-100 rounded-full" />
          <div className="h-8 sm:h-10 w-3/4 sm:w-1/2 bg-slate-300 rounded-xl animate-shimmer" />
          <div className="flex items-center gap-3 pt-1">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-28 bg-slate-200 rounded" />
          </div>
        </div>

        {/* 5-Photo Mosaic Gallery Shimmer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-10 h-[360px] sm:h-[460px] lg:h-[500px]">
          {/* Main Large Left Hero */}
          <div className="lg:col-span-7 rounded-[28px] overflow-hidden bg-slate-200 relative h-full">
            <div className="w-full h-full animate-shimmer" />
          </div>

          {/* Right 4-Grid Thumbnails */}
          <div className="hidden lg:grid lg:col-span-5 grid-cols-2 gap-3 h-full">
            <div className="rounded-[22px] overflow-hidden bg-slate-200 relative">
              <div className="w-full h-full animate-shimmer" />
            </div>
            <div className="rounded-[22px] overflow-hidden bg-slate-200 relative">
              <div className="w-full h-full animate-shimmer" />
            </div>
            <div className="rounded-[22px] overflow-hidden bg-slate-200 relative">
              <div className="w-full h-full animate-shimmer" />
            </div>
            <div className="rounded-[22px] overflow-hidden bg-slate-200 relative">
              <div className="w-full h-full animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Content & Sticky Booking Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column (8 cols): Info, Highlights, Tiers, Itinerary */}
          <div className="lg:col-span-8 space-y-8">
            {/* Highlights Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="h-6 w-44 bg-slate-300 rounded-lg animate-shimmer" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="h-20 bg-slate-100 rounded-2xl animate-shimmer" />
                <div className="h-20 bg-slate-100 rounded-2xl animate-shimmer" />
                <div className="h-20 bg-slate-100 rounded-2xl animate-shimmer" />
                <div className="h-20 bg-slate-100 rounded-2xl animate-shimmer" />
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-3">
              <div className="h-6 w-40 bg-slate-300 rounded-lg animate-shimmer" />
              <div className="space-y-2 pt-2">
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-11/12" />
                <div className="h-4 bg-slate-200 rounded w-4/5" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
              </div>
            </div>

            {/* Tiers / Rooms Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="h-6 w-48 bg-slate-300 rounded-lg animate-shimmer" />
              <div className="space-y-3 pt-2">
                <div className="h-32 bg-slate-100 rounded-2xl animate-shimmer" />
                <div className="h-32 bg-slate-100 rounded-2xl animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Sticky Booking Box Shimmer */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-md space-y-5 sticky top-28">
              <div className="flex items-baseline justify-between pb-4 border-b border-slate-100">
                <div className="h-8 w-28 bg-slate-300 rounded-lg animate-shimmer" />
                <div className="h-4 w-20 bg-slate-200 rounded" />
              </div>

              {/* Date & Guests Picker box */}
              <div className="space-y-3">
                <div className="h-12 bg-slate-100 rounded-xl animate-shimmer" />
                <div className="h-12 bg-slate-100 rounded-xl animate-shimmer" />
              </div>

              {/* Calculation ledger */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="h-4 w-16 bg-slate-200 rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-4 w-14 bg-slate-200 rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                  <div className="h-4 w-16 bg-slate-200 rounded" />
                </div>
              </div>

              {/* Big Reserve Button */}
              <div className="h-14 bg-gradient-to-r from-red-500/50 to-orange-500/50 rounded-2xl animate-shimmer" />

              <div className="h-4 w-3/4 mx-auto bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
