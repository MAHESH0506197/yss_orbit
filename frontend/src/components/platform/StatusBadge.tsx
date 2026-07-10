/**
 * StatusBadge — Pill badge for entity status display (active / inactive / archived).
 * Also exports the `getEntityStatus` helper for deriving status from API flags.
 *
 * @module components/platform/StatusBadge
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Union of valid entity status values */
export type EntityStatus = 'active' | 'inactive' | 'archived';

/** Props for the StatusBadge component */
export interface StatusBadgeProps {
  /** The status to display */
  status: EntityStatus;
  /** Badge size. Default 'md' */
  size?: 'sm' | 'md';
  /** Extra Tailwind classes */
  className?: string;
}

// ---------------------------------------------------------------------------
// Config maps
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<
  EntityStatus,
  { badge: string; dot: string; pulse: boolean; label: string }
> = {
  active: {
    badge:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-400 dark:ring-emerald-800/50',
    dot: 'bg-emerald-500',
    pulse: true,
    label: 'Active',
  },
  inactive: {
    badge:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/25 dark:text-amber-600 dark:ring-amber-800/50',
    dot: 'bg-amber-400',
    pulse: false,
    label: 'Inactive',
  },
  archived: {
    badge:
      'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-900/25 dark:text-rose-400 dark:ring-rose-800/50',
    dot: 'bg-rose-400',
    pulse: false,
    label: 'Archived',
  },
};

const SIZE_MAP: Record<'sm' | 'md', { badge: string; dot: string }> = {
  sm: { badge: 'px-2 py-0.5 text-[10px]', dot: 'h-1.5 w-1.5' },
  md: { badge: 'px-2.5 py-1 text-xs font-semibold', dot: 'h-1.5 w-1.5' },
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Derives the EntityStatus from raw API boolean flags.
 *
 * @param isDeleted  - True when the entity has been soft-deleted / archived
 * @param isActive   - True when the entity is currently active
 * @returns EntityStatus union value
 */
export function getEntityStatus(isDeleted: boolean, isActive: boolean): EntityStatus {
  if (isDeleted) return 'archived';
  if (isActive) return 'active';
  return 'inactive';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Displays a color-coded pill badge for entity status.
 * Supports `active`, `inactive`, and `archived` states.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const { badge, dot, pulse, label } = COLOR_MAP[status];
  const { badge: badgeSize, dot: dotSize } = SIZE_MAP[size];

  return (
    <span
      role="status"
      aria-label={`Status: ${label}`}
      className={`inline-flex items-center gap-1.5 rounded-full ${badgeSize} ${badge} ${className}`}
    >
      <span
        className={`${dotSize} rounded-full ${dot} shrink-0 ${pulse ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
};

export default StatusBadge;
