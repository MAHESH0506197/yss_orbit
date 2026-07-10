/**
 * KpiStrip — horizontal strip of KPI metric cards for detail page heroes.
 *
 * Each card shows an icon, a large numeric/text value, and a small label.
 * Cards are optionally clickable and shrink/grow flexibly.
 *
 * @module KpiStrip
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single KPI metric card definition. */
export interface KpiItem {
  /** Lucide (or any React SVG) icon component rendered at the top of the card. */
  icon: React.ElementType;
  /** Short descriptive label shown beneath the value. */
  label: string;
  /** The primary metric value — can be a string, number, or React node. */
  value: React.ReactNode;
  /**
   * Tailwind text-color class applied to the icon and value.
   * @default 'text-violet-600 dark:text-violet-400'
   */
  color?: string;
  /**
   * Tailwind background class applied to the card.
   * @default 'bg-violet-50 dark:bg-violet-900/20'
   */
  bg?: string;
  /** When provided, the card renders as a `<button>` and calls this on click. */
  onClick?: () => void;
}

/** Props for the KpiStrip wrapper component. */
export interface KpiStripProps {
  /** Array of KPI items to display as cards. */
  items: KpiItem[];
  /** Extra Tailwind classes applied to the outermost flex wrapper. */
  className?: string;
}

// ---------------------------------------------------------------------------
// KpiCard — internal single card renderer
// ---------------------------------------------------------------------------

const KpiCard: React.FC<KpiItem> = ({
  icon: Icon,
  label,
  value,
  color = 'text-violet-600 dark:text-violet-400',
  bg = 'bg-violet-50 dark:bg-violet-900/20',
  onClick,
}) => {
  const baseClasses = [
    'flex flex-col items-center justify-center rounded-2xl px-4 py-4 gap-1 min-w-[90px] flex-1',
    bg,
    onClick
      ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <Icon className={`h-5 w-5 ${color} mb-0.5`} aria-hidden="true" />
      <div className={`text-2xl font-black tabular-nums leading-none ${color}`}>
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
        {label}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label}: ${typeof value === 'string' || typeof value === 'number' ? value : label}`}
        className={baseClasses}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
};

// ---------------------------------------------------------------------------
// KpiStrip — exported named component
// ---------------------------------------------------------------------------

/**
 * KpiStrip renders a responsive, horizontal flex strip of KPI metric cards.
 *
 * Cards flex-wrap on smaller screens and each card expands equally to fill
 * available space. Optionally clickable cards elevate on hover.
 *
 * @example
 * ```tsx
 * import { KpiStrip } from '@/components/platform/KpiStrip';
 * import { Users, Activity, TrendingUp } from 'lucide-react';
 *
 * <KpiStrip
 *   items={[
 *     { icon: Users, label: 'Members', value: 42 },
 *     {
 *       icon: Activity,
 *       label: 'Active',
 *       value: '98%',
 *       color: 'text-emerald-600 dark:text-emerald-400',
 *       bg: 'bg-emerald-50 dark:bg-emerald-900/20',
 *     },
 *     {
 *       icon: TrendingUp,
 *       label: 'Growth',
 *       value: '+12%',
 *       color: 'text-amber-600 dark:text-amber-400',
 *       bg: 'bg-amber-50 dark:bg-amber-900/20',
 *       onClick: () => navigateToGrowthReport(),
 *     },
 *   ]}
 * />
 * ```
 */
export const KpiStrip: React.FC<KpiStripProps> = ({ items, className }) => {
  return (
    <div
      role="list"
      aria-label="Key performance indicators"
      className={`flex flex-wrap gap-3 ${className ?? ''}`}
    >
      {items.map((item, i) => (
        <div key={i} role="listitem" className="flex flex-1 min-w-[90px]">
          <KpiCard {...item} />
        </div>
      ))}
    </div>
  );
};

export default KpiStrip;
