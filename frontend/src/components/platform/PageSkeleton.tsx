// src/components/platform/PageSkeleton.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton that matches the real list/detail page layout.
// Replaces the ad-hoc skeleton divs duplicated in BD, Org, BU pages.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';

export interface PageSkeletonProps {
  /** 'list' = list page with stat cards + table. 'detail' = detail page with hero + tabs. Default 'list' */
  variant?: 'list' | 'detail';
  /** Number of stat cards to render. Default 5 */
  statCards?: number;
  /** Number of table rows to render. Default 6 */
  rows?: number;
}

/** Reusable shimmer block */
function Bone({ className }: { className: string }) {
  return (
    <div className={`rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse ${className}`} />
  );
}

function ListSkeleton({ statCards = 5, rows = 6 }: { statCards?: number; rows?: number }) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Bone className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Bone className="h-7 w-48" />
            <Bone className="h-4 w-72" />
          </div>
        </div>
        <Bone className="h-10 w-36 rounded-xl" />
      </div>

      {/* Stat cards */}
      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${statCards}, minmax(0, 1fr))` }}>
        {Array.from({ length: statCards }).map((_, i) => (
          <Bone key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50">
        {/* Filter bar */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-3.5 gap-4">
          <Bone className="h-9 w-64 rounded-xl" />
          <div className="flex gap-2">
            <Bone className="h-9 w-36 rounded-xl" />
            <Bone className="h-9 w-9 rounded-xl" />
            <Bone className="h-9 w-20 rounded-xl" />
          </div>
        </div>

        {/* Table rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <Bone className="h-4 w-4 rounded shrink-0" />
              <Bone className="h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <Bone className="h-4 w-36" />
                <Bone className="h-3 w-20" />
              </div>
              <Bone className="h-6 w-16 rounded-full" />
              <Bone className="h-5 w-10 rounded" />
              <Bone className="h-5 w-10 rounded" />
              <Bone className="h-8 w-8 rounded-lg ml-auto shrink-0" />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-5 py-3">
          <Bone className="h-4 w-40" />
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Bone key={i} className="h-8 w-8 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back button + breadcrumb */}
      <div className="flex items-center gap-2">
        <Bone className="h-4 w-16" />
        <Bone className="h-3 w-3 rounded-full" />
        <Bone className="h-4 w-32" />
      </div>

      {/* Hero block */}
      <Bone className="h-52 w-full rounded-3xl" />

      {/* KPI strip */}
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="flex-1 h-24 rounded-2xl" />
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-11 w-28 rounded-t-lg mx-1" />
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton({ variant = 'list', statCards, rows }: PageSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading…"
      aria-busy="true"
      className="w-full"
    >
      <span className="sr-only">Loading…</span>
      {variant === 'list' ? (
        <ListSkeleton statCards={statCards} rows={rows} />
      ) : (
        <DetailSkeleton />
      )}
    </div>
  );
}

export default PageSkeleton;
