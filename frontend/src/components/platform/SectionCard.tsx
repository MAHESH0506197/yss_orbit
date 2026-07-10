/**
 * SectionCard — Consistent card wrapper for information sections in
 * detail and form pages across the yss_orbit platform.
 *
 * Supports an optional titled header with an icon, description, and
 * action slot, plus a content body that can be padded or edge-to-edge.
 *
 * @module components/platform/SectionCard
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for the SectionCard component */
export interface SectionCardProps {
  /** Card title shown in header */
  title?: string;
  /** Optional description below title */
  description?: string;
  /** Optional Lucide icon component shown left of title */
  icon?: React.ElementType;
  /** Icon color class. Default 'text-violet-500' */
  iconColor?: string;
  /** Right side of card header — buttons, badges */
  headerActions?: React.ReactNode;
  /** Card body content */
  children: React.ReactNode;
  /** Remove default body padding (for tables or custom padding) */
  noPadding?: boolean;
  /** Extra classes on outer wrapper */
  className?: string;
  /** Animation delay class (e.g. 'delay-100') */
  animDelay?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Card wrapper used for all information sections in detail and form pages.
 * Renders a titled header (optional) with icon + description + action slot,
 * and a body area with configurable padding.
 */
export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  icon: Icon,
  iconColor = 'text-violet-500',
  headerActions,
  children,
  noPadding = false,
  className = '',
  animDelay = '',
}) => {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm animate-fadeInUp ${animDelay} ${className}`}
    >
      {/* Header — only rendered when a title is provided */}
      {title && (
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <Icon
                className={`h-[18px] w-[18px] shrink-0 ${iconColor}`}
                aria-hidden="true"
              />
            )}
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {title}
              </h2>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                  {description}
                </p>
              )}
            </div>
          </div>

          {headerActions && (
            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
};

export default SectionCard;
