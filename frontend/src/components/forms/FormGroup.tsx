// src/components/forms/FormGroup.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormGroupProps {
  /** Section heading */
  title?: string;
  /** Description text */
  description?: string;
  /** Optional section icon */
  icon?: LucideIcon;
  /** Number of columns for the fields grid (default 1) */
  columns?: 1 | 2 | 3;
  /** Show card container */
  card?: boolean;
  /** Show a section divider at the top */
  divided?: boolean;
  className?: string;
  children: React.ReactNode;
}

// ─── Column classes ───────────────────────────────────────────────────────────

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const FormGroup: React.FC<FormGroupProps> = ({
  title,
  description,
  icon: Icon,
  columns = 1,
  card = false,
  divided = false,
  className,
  children,
}) => {
  const inner = (
    <div className={cn('space-y-5', className)}>
      {/* Group header */}
      {(title || description) && (
        <div className={cn('space-y-0.5', divided && 'pb-4 border-b border-border')}>
          {title && (
            <div className="flex items-center gap-2">
              {Icon && (
                <Icon size={16} strokeWidth={2} className="text-muted-foreground shrink-0" />
              )}
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                {title}
              </h3>
            </div>
          )}
          {description && (
            <p className={cn('text-xs text-muted-foreground leading-relaxed', Icon ? 'pl-[22px]' : '')}>
              {description}
            </p>
          )}
        </div>
      )}

      {/* Fields grid */}
      <div className={cn('grid gap-4', GRID_COLS[columns])}>
        {children}
      </div>
    </div>
  );

  if (card) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        {inner}
      </div>
    );
  }

  return inner;
};

export default FormGroup;
