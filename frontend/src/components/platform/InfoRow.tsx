/**
 * InfoRow — Single field-display row for detail pages.
 * Renders an icon, uppercase label, and rich-content value in a
 * consistent layout with optional bottom border for row grouping.
 *
 * @module components/platform/InfoRow
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for the InfoRow component */
export interface InfoRowProps {
  /** Lucide icon component */
  icon: React.ElementType;
  /** Field label */
  label: string;
  /** Field value content */
  children: React.ReactNode;
  /** Icon color. Default 'text-gray-400 dark:text-gray-500' */
  iconColor?: string;
  /** If true, removes bottom border (for last row in group) */
  last?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * A single field-display row used on entity detail pages.
 * Shows a Lucide icon, a small-caps label, and arbitrary value content.
 * Stack multiple InfoRow components inside a SectionCard body for a
 * consistent data-display pattern.
 */
export const InfoRow: React.FC<InfoRowProps> = ({
  icon: Icon,
  label,
  children,
  iconColor,
  last = false,
}) => {
  return (
    <div
      className={`flex items-start gap-3 py-3.5 ${
        last ? '' : 'border-b border-gray-100 dark:border-gray-800'
      }`}
    >
      {/* Icon column */}
      <div
        className={`shrink-0 mt-0.5 ${iconColor ?? 'text-gray-400 dark:text-gray-500'}`}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      {/* Label + value column */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
          {label}
        </div>
        <div className="text-sm text-gray-900 dark:text-white font-medium break-words">
          {children}
        </div>
      </div>
    </div>
  );
};

export default InfoRow;
