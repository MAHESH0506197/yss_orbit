// src/components/platform/CardGrid.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Enterprise CardGrid — v2.0 Audit Improvements
//
//  FIXES:
//  ✅ Added `density` prop — renders 4-column grid at compact density
//     (previously hardcoded to 3 columns regardless of density setting)
//  ✅ Added `columns` override prop for one-off overrides
//  ✅ Improved empty state container padding

import React from 'react';

interface CardGridProps {
  children: React.ReactNode;
  emptyState?: React.ReactNode;
  isEmpty?: boolean;
  /** Controls column count at each breakpoint */
  density?: 'comfortable' | 'compact';
  /** Override: explicit column count (overrides density-based columns) */
  columns?: 2 | 3 | 4;
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  emptyState,
  isEmpty,
  density = 'comfortable',
  columns,
}) => {
  if (isEmpty && emptyState) {
    return <div className="p-5">{emptyState}</div>;
  }

  // Density-aware responsive column classes
  // comfortable: 1 → 2 → 3 (standard enterprise grid)
  // compact:     1 → 2 → 3 → 4 (high-density like Linear board view)
  const gridCols = columns
    ? {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      }[columns]
    : density === 'compact'
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="p-5">
      <div className={`grid ${gridCols} gap-5 items-stretch`}>
        {children}
      </div>
    </div>
  );
};
