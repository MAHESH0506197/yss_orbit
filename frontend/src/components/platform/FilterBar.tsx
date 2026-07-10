// src/components/platform/FilterBar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Combined search + sort + view-toggle toolbar for list pages.
// Replaces the inline filter toolbars duplicated in BD, Org, BU list pages.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { Search, X, Loader2, RefreshCcw } from 'lucide-react';
import { ViewModeToggle } from '@/components/platform/ViewModeToggle';
import { ViewMode } from '@/hooks/useViewMode';

export interface SortOption {
  label: string;
  value: string;
}

export interface FilterBarProps {
  // ── Search ─────────────────────────────────────────────────────────────────
  search: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  isSearching?: boolean;

  // ── Sort ───────────────────────────────────────────────────────────────────
  sortOptions?: SortOption[];
  sort?: string;
  onSort?: (value: string) => void;

  // ── View mode ──────────────────────────────────────────────────────────────
  viewMode?: ViewMode;
  onViewMode?: (mode: ViewMode) => void;

  // ── Refresh ────────────────────────────────────────────────────────────────
  isFetching?: boolean;
  onRefresh?: () => void;

  // ── Custom right slot ──────────────────────────────────────────────────────
  /** Rendered at the far right of the toolbar (e.g. Export button) */
  rightSlot?: React.ReactNode;

  /** Extra classes on the outer wrapper */
  className?: string;
}

export function FilterBar({
  search,
  onSearch,
  placeholder = 'Search…',
  isSearching,
  sortOptions,
  sort,
  onSort,
  viewMode,
  onViewMode,
  isFetching,
  onRefresh,
  rightSlot,
  className,
}: FilterBarProps) {
  return (
    <div
      className={`flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 px-5 py-3.5 ${className ?? ''}`}
    >
      {/* ── Search input ─────────────────────────────────────────────────── */}
      <div className="relative w-full xl:max-w-xs flex-1 min-w-0">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={placeholder}
          aria-label="Search"
          className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 py-2 pl-9 pr-8 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
        />
        {/* Right adornment: spinner while searching, X to clear otherwise */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" aria-label="Searching…" />
          ) : search ? (
            <button
              type="button"
              onClick={() => onSearch('')}
              aria-label="Clear search"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus-visible:outline-none"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Right controls ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {/* Sort select */}
        {sortOptions && sortOptions.length > 0 && onSort && (
          <select
            value={sort}
            onChange={e => onSort(e.target.value)}
            aria-label="Sort by"
            className="h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-3 pr-8 text-sm text-gray-700 dark:text-gray-300 transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none cursor-pointer appearance-none"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isFetching}
            aria-label="Refresh data"
            title="Refresh"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <RefreshCcw
              className={`h-4 w-4 transition-transform ${isFetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </button>
        )}

        {/* View mode toggle */}
        {viewMode && onViewMode && (
          <ViewModeToggle
            viewMode={viewMode}
            setViewMode={onViewMode}
          />
        )}

        {/* Custom right slot */}
        {rightSlot}
      </div>
    </div>
  );
}

export default FilterBar;
