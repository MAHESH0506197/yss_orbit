// src/components/feedback/SkeletonLoader.tsx
import React from 'react';
import { cn } from '../../utils/cn';

// ─── Base Skeleton ────────────────────────────────────────────────────────────

export interface SkeletonProps {
  /** Tailwind width class or value */
  width?: string;
  /** Tailwind height class or value */
  height?: string;
  /** Shape */
  variant?: 'rectangle' | 'circle' | 'text' | 'button';
  /** Animation style */
  animation?: 'pulse' | 'shimmer' | 'none';
  className?: string;
}

const shimmerCls = [
  'relative overflow-hidden',
  'before:absolute before:inset-0',
  'before:bg-gradient-to-r before:from-transparent before:via-white/30 dark:before:via-white/10 before:to-transparent',
  'before:animate-[shimmer_1.4s_ease-in-out_infinite]',
  'before:bg-[length:200%_100%]',
].join(' ');

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'rectangle',
  animation = 'shimmer',
  className,
}) => {
  const shape: Record<string, string> = {
    rectangle: 'rounded-md',
    circle:    'rounded-full',
    text:      'rounded',
    button:    'rounded-lg',
  };

  const animCls =
    animation === 'pulse'   ? 'animate-pulse'
    : animation === 'shimmer' ? shimmerCls
    : '';

  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-muted',
        shape[variant],
        animCls,
        width  ?? 'w-full',
        height ?? (variant === 'text' ? 'h-3' : 'h-4'),
        className,
      )}
    />
  );
};

// ─── Compound presets ─────────────────────────────────────────────────────────

/** Skeleton for a text paragraph — multiple lines */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  const widths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4', 'w-2/3'];
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={widths[i % widths.length]} height="h-3" />
      ))}
    </div>
  );
}

/** Skeleton for a stat card */
export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 border-l-4 border-l-border space-y-3', className)} aria-hidden="true">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton width="w-24" height="h-3" />
          <Skeleton width="w-32" height="h-8" />
          <Skeleton width="w-20" height="h-4" />
        </div>
        <Skeleton variant="circle" width="w-11" height="h-11" />
      </div>
    </div>
  );
}

/** Skeleton for a table row */
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton width={i === 0 ? 'w-32' : i === cols - 1 ? 'w-16' : 'w-full'} height="h-3.5" />
        </td>
      ))}
    </tr>
  );
}

/** Skeleton for an entire table */
export function SkeletonTable({ rows = 5, cols = 5, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border overflow-hidden', className)} aria-hidden="true">
      {/* Header */}
      <div className="border-b border-border bg-muted/40 px-4 py-3 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={i === 0 ? 'w-28' : 'w-20'} height="h-3" />
        ))}
      </div>
      {/* Rows */}
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Skeleton for a page header */
export function SkeletonPageHeader({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)} aria-hidden="true">
      <Skeleton width="w-36" height="h-3" />
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton width="w-56" height="h-7" />
          <Skeleton width="w-80" height="h-3" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="button" width="w-24" height="h-9" />
          <Skeleton variant="button" width="w-28" height="h-9" />
        </div>
      </div>
      <Skeleton height="h-px" width="w-full" />
    </div>
  );
}

/** Skeleton for a form */
export function SkeletonForm({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn('space-y-5', className)} aria-hidden="true">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton width="w-24" height="h-3" />
          <Skeleton variant="button" height="h-10" />
        </div>
      ))}
    </div>
  );
}

// ─── Main export (generic wrapper kept for backward compat) ──────────────────

export interface SkeletonLoaderProps {
  /** Preset layout to render */
  preset?: 'card' | 'table' | 'form' | 'text' | 'page-header' | 'custom';
  rows?: number;
  cols?: number;
  fields?: number;
  lines?: number;
  className?: string;
  /** For preset=custom — render children instead */
  children?: React.ReactNode;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  preset = 'custom',
  rows = 5,
  cols = 5,
  fields = 4,
  lines = 3,
  className,
  children,
}) => {
  if (preset === 'card')        return <SkeletonStatCard className={className} />;
  if (preset === 'table')       return <SkeletonTable rows={rows} cols={cols} className={className} />;
  if (preset === 'form')        return <SkeletonForm fields={fields} className={className} />;
  if (preset === 'text')        return <SkeletonText lines={lines} className={className} />;
  if (preset === 'page-header') return <SkeletonPageHeader className={className} />;

  return <>{children}</>;
};

export default SkeletonLoader;
