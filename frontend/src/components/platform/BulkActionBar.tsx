// src/components/platform/BulkActionBar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Floating bottom bar for multi-select bulk operations.
// Adds the missing BulkActionBar to BU list page; standardizes BD + Org pages.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { Archive, RotateCcw, Trash2, X, CheckSquare, Loader2 } from 'lucide-react';

export interface BulkActionBarProps {
  /** Number of currently selected items */
  selectedCount: number;
  /** Called to archive all selected items */
  onArchive?: () => void;
  /** Called to restore all selected items */
  onRestore?: () => void;
  /** Called to permanently delete all selected items */
  onDelete?: () => void;
  /** Called to clear the selection */
  onClear: () => void;
  /** Whether a bulk action is currently in flight */
  isLoading?: boolean;
  /** Custom label. Default: '{count} selected' */
  label?: string;
}

export function BulkActionBar({
  selectedCount,
  onArchive,
  onRestore,
  onDelete,
  onClear,
  isLoading,
  label,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  const actionBtnClass =
    'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500';

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fadeInUp pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/95 dark:bg-gray-900/95 px-5 py-3 shadow-2xl shadow-gray-900/10 dark:shadow-gray-900/50 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/5">

        {/* Selected count chip */}
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 px-3 text-sm font-bold text-violet-700 dark:text-violet-300 shrink-0">
          {isLoading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            : <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
          }
          {label ?? `${selectedCount} selected`}
        </span>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 shrink-0" aria-hidden="true" />

        {/* Action buttons */}
        {onArchive && (
          <button
            type="button"
            onClick={onArchive}
            disabled={isLoading}
            className={`${actionBtnClass} text-gray-700 dark:text-gray-300`}
            aria-label={`Archive ${selectedCount} selected items`}
          >
            <Archive className="h-3.5 w-3.5" aria-hidden="true" />
            Archive
          </button>
        )}

        {onRestore && (
          <button
            type="button"
            onClick={onRestore}
            disabled={isLoading}
            className={`${actionBtnClass} text-emerald-700 dark:text-emerald-400`}
            aria-label={`Restore ${selectedCount} selected items`}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Restore
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isLoading}
            className={`${actionBtnClass} text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20`}
            aria-label={`Permanently delete ${selectedCount} selected items`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </button>
        )}

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 shrink-0" aria-hidden="true" />

        {/* Clear selection */}
        <button
          type="button"
          onClick={onClear}
          disabled={isLoading}
          aria-label="Clear selection"
          title="Clear selection"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default BulkActionBar;
