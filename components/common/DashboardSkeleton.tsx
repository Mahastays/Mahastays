'use client';

import React from 'react';

interface DashboardSkeletonProps {
  type?: 'table' | 'cards' | 'overview';
}

export default function DashboardSkeleton({ type = 'table' }: DashboardSkeletonProps) {
  return (
    <div className="space-y-6 animate-pulse w-full">
      {/* 1. Top Filter & Action Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="h-9 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-28 rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />
          <div className="h-9 w-28 rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />
          <div className="h-9 w-32 rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="h-9 w-48 rounded-full bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <div className="h-9 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* 2. Top Stats Metric Cards (Optional / Contextual) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-7 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-2.5 w-32 rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
        ))}
      </div>

      {/* 3. Main Data Container Skeleton (Table Rows or Card Grid) */}
      {type === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs space-y-4 p-4"
            >
              <div className="h-44 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/60" />
              <div className="flex items-center justify-between pt-2">
                <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-7 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Table Header Placeholder */}
          <div className="h-12 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 px-6 flex items-center justify-between">
            <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3.5 w-28 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3.5 w-20 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3.5 w-16 rounded bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Table Rows Placeholders */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[1, 2, 3, 4, 5, 6, 7].map((row) => (
              <div key={row} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-slate-800/60" />
                  </div>
                </div>
                <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                <div className="h-3.5 w-20 rounded bg-slate-200 dark:bg-slate-800 hidden md:block" />
                <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-3.5 w-16 rounded bg-slate-200 dark:bg-slate-800 text-right" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

