// src/components/data_display/StatCard.tsx
import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatCardVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
type StatCardSize     = 'sm' | 'md' | 'lg';

interface SparkPoint { value: number }

export interface StatCardProps {
  /** Main numeric or text value */
  value: string | number;
  /** Label beneath the value */
  label: string;
  /** Optional sub-label or unit */
  sublabel?: string;
  /** Lucide icon component */
  icon?: LucideIcon;
  /** Percentage change (positive = up, negative = down, 0 = flat) */
  trend?: number;
  /** Short trend label e.g. "vs last month" */
  trendLabel?: string;
  /** Optional description line */
  description?: string;
  /** Colour variant */
  variant?: StatCardVariant;
  /** Size variant */
  size?: StatCardSize;
  /** Show a mini sparkline bar-chart */
  sparkline?: SparkPoint[];
  /** Show skeleton shimmer instead of data */
  loading?: boolean;
  /** Progress bar value 0-100 */
  progress?: number;
  /** Optional right-aligned badge */
  badge?: string;
  /** Extra class names for the wrapper */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

// ─── Variant tokens ──────────────────────────────────────────────────────────

const VARIANT: Record<
  StatCardVariant,
  { icon: string; accent: string; badge: string; progress: string; sparkFill: string }
> = {
  default: {
    icon:      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    accent:    'border-l-gray-400',
    badge:     'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    progress:  'from-gray-400 to-gray-500',
    sparkFill: '#6b7280',
  },
  primary: {
    icon:      'bg-primary/10 text-primary',
    accent:    'border-l-primary',
    badge:     'bg-primary/10 text-primary',
    progress:  'from-primary to-blue-400',
    sparkFill: '#2563eb',
  },
  success: {
    icon:      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    accent:    'border-l-emerald-500',
    badge:     'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    progress:  'from-emerald-500 to-teal-400',
    sparkFill: '#10b981',
  },
  warning: {
    icon:      'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    accent:    'border-l-amber-500',
    badge:     'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    progress:  'from-amber-400 to-orange-400',
    sparkFill: '#f59e0b',
  },
  danger: {
    icon:      'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
    accent:    'border-l-red-500',
    badge:     'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    progress:  'from-red-500 to-rose-400',
    sparkFill: '#ef4444',
  },
  info: {
    icon:      'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
    accent:    'border-l-sky-500',
    badge:     'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
    progress:  'from-sky-500 to-cyan-400',
    sparkFill: '#0ea5e9',
  },
  purple: {
    icon:      'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
    accent:    'border-l-purple-500',
    badge:     'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
    progress:  'from-purple-500 to-violet-400',
    sparkFill: '#8b5cf6',
  },
};

const SIZE = {
  sm: { wrapper: 'p-4', icon: 'h-9 w-9', iconSize: 16, value: 'text-2xl', label: 'text-xs' },
  md: { wrapper: 'p-5', icon: 'h-11 w-11', iconSize: 20, value: 'text-3xl', label: 'text-sm' },
  lg: { wrapper: 'p-6', icon: 'h-13 w-13', iconSize: 24, value: 'text-4xl', label: 'text-base' },
};

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ points, fill }: { points: SparkPoint[]; fill: string }) {
  if (!points.length) return null;
  const max = Math.max(...points.map(p => p.value), 1);
  const W = 80, H = 32;
  const barW = Math.max(2, (W / points.length) - 2);

  return (
    <svg width={W} height={H} className="overflow-visible opacity-80" aria-hidden="true">
      {points.map((p, i) => {
        const barH = Math.max(2, (p.value / max) * H);
        const x = i * (W / points.length);
        const y = H - barH;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={1}
            fill={fill}
            opacity={0.5 + (i / points.length) * 0.5}
          />
        );
      })}
    </svg>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function StatCardSkeleton({ size = 'md', className }: { size?: StatCardSize; className?: string }) {
  return (
    <div
      className={cn(
        'relative rounded-xl border border-border bg-card border-l-4 border-l-border overflow-hidden',
        SIZE[size].wrapper,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="h-3 w-24 rounded-md bg-muted animate-pulse" />
          <div className="h-8 w-32 rounded-md bg-muted animate-pulse" />
          <div className="h-3 w-20 rounded-md bg-muted animate-pulse" />
        </div>
        <div className={cn('rounded-xl bg-muted animate-pulse shrink-0', SIZE[size].icon)} />
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  sublabel,
  icon: Icon,
  trend,
  trendLabel = 'vs last period',
  description,
  variant = 'default',
  size = 'md',
  sparkline,
  loading = false,
  progress,
  badge,
  className,
  onClick,
}) => {
  if (loading) {
    return <StatCardSkeleton size={size} className={className} />;
  }

  const v   = VARIANT[variant];
  const s   = SIZE[size];

  const isClickable = !!onClick;

  const TrendIcon =
    trend === undefined ? null
    : trend > 0         ? TrendingUp
    : trend < 0         ? TrendingDown
    : Minus;

  const trendColor =
    trend === undefined ? ''
    : trend > 0         ? 'text-emerald-600 dark:text-emerald-400'
    : trend < 0         ? 'text-red-500 dark:text-red-400'
    : 'text-muted-foreground';

  const trendBg =
    trend === undefined ? ''
    : trend > 0         ? 'bg-emerald-50 dark:bg-emerald-950/30'
    : trend < 0         ? 'bg-red-50 dark:bg-red-950/30'
    : 'bg-muted/60';

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={cn(
        'group relative rounded-xl border border-border bg-card border-l-4 overflow-hidden',
        'transition-all duration-200',
        v.accent,
        s.wrapper,
        isClickable && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">

        {/* Left: Label + Value */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <p className={cn('font-semibold text-muted-foreground uppercase tracking-wider truncate', s.label)}>
              {label}
            </p>
            {badge && (
              <span className={cn('shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide', v.badge)}>
                {badge}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className={cn('font-bold text-foreground leading-none tracking-tight tabular-nums', s.value)}>
              {value}
            </span>
            {sublabel && (
              <span className="text-xs text-muted-foreground font-medium">{sublabel}</span>
            )}
          </div>

          {/* Trend */}
          {(trend !== undefined && TrendIcon) && (
            <div className={cn('mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold', trendBg, trendColor)}>
              <TrendIcon size={12} strokeWidth={2.5} />
              <span>{Math.abs(trend)}%</span>
              {trendLabel && <span className="font-normal text-muted-foreground">{trendLabel}</span>}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Right: Icon + Sparkline */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {Icon && (
            <div className={cn('flex items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105', s.icon, v.icon)}>
              <Icon size={s.iconSize} strokeWidth={1.75} />
            </div>
          )}
          {sparkline && sparkline.length > 0 && (
            <div className="mt-1">
              <Sparkline points={sparkline} fill={v.sparkFill} />
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="mt-4 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Progress</span>
            <span className="text-xs font-bold text-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', v.progress)}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtle hover gradient overlay */}
      {isClickable && (
        <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-br from-white/5 to-transparent dark:from-white/[0.02]" />
      )}
    </div>
  );
};

export default StatCard;
