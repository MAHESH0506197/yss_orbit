// src/components/feedback/LoadingSpinner.tsx
import React from 'react';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SpinnerSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'white' | 'muted' | 'success' | 'warning' | 'danger';

export interface LoadingSpinnerProps {
  size?:    SpinnerSize;
  variant?: SpinnerVariant;
  /** Text shown below the spinner */
  label?:   string;
  /** Fill the parent container and centre */
  fullscreen?: boolean;
  /** Semi-transparent overlay on top of parent */
  overlay?: boolean;
  className?: string;
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

const SIZES: Record<SpinnerSize, { ring: string; label: string }> = {
  xs: { ring: 'h-3 w-3 border-[1.5px]', label: 'text-[10px]' },
  sm: { ring: 'h-4 w-4 border-2',       label: 'text-xs' },
  md: { ring: 'h-6 w-6 border-2',       label: 'text-sm' },
  lg: { ring: 'h-9 w-9 border-[3px]',   label: 'text-sm' },
  xl: { ring: 'h-12 w-12 border-4',     label: 'text-base' },
};

const COLORS: Record<SpinnerVariant, string> = {
  primary: 'border-primary/20 border-t-primary',
  white:   'border-white/20 border-t-white',
  muted:   'border-muted-foreground/20 border-t-muted-foreground',
  success: 'border-emerald-200 border-t-emerald-500 dark:border-emerald-900 dark:border-t-emerald-400',
  warning: 'border-amber-200 border-t-amber-500 dark:border-amber-900 dark:border-t-amber-400',
  danger:  'border-red-200 border-t-red-500 dark:border-red-900 dark:border-t-red-400',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  label,
  fullscreen = false,
  overlay = false,
  className,
}) => {
  const { ring, label: labelCls } = SIZES[size];
  const colorCls = COLORS[variant];

  const spinner = (
    <div
      role="status"
      aria-label={label ?? 'Loading'}
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullscreen && 'min-h-[200px]',
        className,
      )}
    >
      <div
        className={cn(
          'animate-spin rounded-full',
          ring,
          colorCls,
        )}
        aria-hidden="true"
      />
      {label && (
        <span className={cn('text-muted-foreground font-medium', labelCls)}>
          {label}
        </span>
      )}
      <span className="sr-only">{label ?? 'Loading…'}</span>
    </div>
  );

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-inherit">
        {spinner}
      </div>
    );
  }

  if (fullscreen) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
