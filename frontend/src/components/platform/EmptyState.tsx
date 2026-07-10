// src/components/platform/EmptyState.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Universal empty state for list pages.
// Replaces the inline empty state components duplicated in BD, Org, BU pages.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { X, Plus, Building2 } from 'lucide-react';
import { PermissionGate } from '@/components/auth/PermissionGate';

export interface EmptyStateProps {
  /** Lucide icon component. Default: Building2 */
  icon?: React.ElementType;
  /** Primary heading. Required. */
  title: string;
  /** Supporting description paragraph. Required. */
  description: string;
  /** If true, renders a 'Clear Filters' button instead of the create CTA */
  hasFilters?: boolean;
  /** Called when 'Clear Filters' is clicked */
  onClear?: () => void;
  /** Called when the create CTA is clicked */
  onCreate?: () => void;
  /** Label for the create button. Default: 'Create New' */
  createLabel?: string;
  /** RBAC permission string. When provided, wraps create button in PermissionGate */
  createPermission?: string;
  /** Extra classes on the outer wrapper div */
  className?: string;
}

function CreateButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

export function EmptyState({
  icon: Icon = Building2,
  title,
  description,
  hasFilters,
  onClear,
  onCreate,
  createLabel = 'Create New',
  createPermission,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-20 text-center px-6 ${className ?? ''}`}
      aria-live="polite"
    >
      {/* Icon container */}
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-3xl mb-5 shadow-sm ring-1 ${
          hasFilters
            ? 'bg-gray-50 dark:bg-gray-800/50 ring-gray-200 dark:ring-gray-700'
            : 'bg-violet-50/80 dark:bg-violet-500/10 ring-violet-100 dark:ring-violet-500/20'
        }`}
      >
        <Icon
          className={`h-10 w-10 ${
            hasFilters ? 'text-gray-400 dark:text-gray-500' : 'text-violet-500 dark:text-violet-400'
          }`}
          aria-hidden="true"
        />
      </div>

      {/* Text */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm leading-relaxed">
        {description}
      </p>

      {/* CTA */}
      {hasFilters ? (
        onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear Filters
          </button>
        )
      ) : (
        onCreate && (
          createPermission ? (
            <PermissionGate permission={createPermission}>
              <CreateButton onClick={onCreate} label={createLabel} />
            </PermissionGate>
          ) : (
            <CreateButton onClick={onCreate} label={createLabel} />
          )
        )
      )}
    </div>
  );
}

export default EmptyState;
