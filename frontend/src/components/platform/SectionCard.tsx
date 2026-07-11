/**
 * SectionCard — Consistent card wrapper for information sections in
 * detail and form pages across the yss_orbit platform.
 *
 * Supports an optional titled header with an icon, description, and
 * action slot, plus a content body that can be padded or edge-to-edge.
 *
 * @module components/platform/SectionCard
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  /** Make section collapsible */
  collapsible?: boolean;
  /** Initial expanded state */
  defaultExpanded?: boolean;
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
  collapsible = false,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className={`overflow-hidden rounded-[20px] border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] animate-fadeInUp ${animDelay} ${className}`}
    >
      {/* Header — only rendered when a title is provided */}
      {title && (
        <div 
          className={`flex items-center justify-between border-b border-gray-200/50 dark:border-white/5 px-6 py-5 bg-white/40 dark:bg-white/5 ${collapsible ? 'cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 transition-colors' : ''}`}
          onClick={() => collapsible && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-gray-700/50 ${iconColor}`}>
                <Icon
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
              </div>
            )}
            <div>
              <h2 className="text-[15px] font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                {title}
              </h2>
              {description && (
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug font-medium">
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {headerActions && (
              <div className="flex items-center gap-2" onClick={(e) => collapsible && e.stopPropagation()}>
                {headerActions}
              </div>
            )}
            {collapsible && (
              <button 
                type="button" 
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-400 dark:text-slate-500"
              >
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      {(!title || isExpanded) && (
        <div className={noPadding ? '' : 'p-6 lg:p-8'}>
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionCard;
