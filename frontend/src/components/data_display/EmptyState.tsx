// src/components/data_display/EmptyState.tsx
import React from 'react';
import { LucideIcon, SearchX, FolderOpen, Database, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmptyStateVariant = 'default' | 'search' | 'filter' | 'error' | 'permission';
export type EmptyStateSize    = 'sm' | 'md' | 'lg';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  /** Visual preset */
  variant?: EmptyStateVariant;
  /** Override the default icon */
  icon?: LucideIcon;
  /** Override heading */
  title?: string;
  /** Override body text */
  description?: string;
  /** Primary and/or secondary actions */
  actions?: EmptyStateAction[];
  size?: EmptyStateSize;
  className?: string;
}

// ─── Preset configs ───────────────────────────────────────────────────────────

const PRESETS: Record<
  EmptyStateVariant,
  { Icon: LucideIcon; title: string; description: string; iconCls: string; bgCls: string }
> = {
  default: {
    Icon:        FolderOpen,
    title:       'Nothing here yet',
    description: 'Create your first item to get started.',
    iconCls:     'text-muted-foreground',
    bgCls:       'bg-muted/40',
  },
  search: {
    Icon:        SearchX,
    title:       'No results found',
    description: 'Try adjusting your search query or clearing the filters.',
    iconCls:     'text-muted-foreground',
    bgCls:       'bg-muted/40',
  },
  filter: {
    Icon:        Database,
    title:       'No matching records',
    description: 'No records match the active filters. Try changing or removing filters.',
    iconCls:     'text-muted-foreground',
    bgCls:       'bg-muted/40',
  },
  error: {
    Icon:        AlertCircle,
    title:       'Something went wrong',
    description: 'We could not load this data. Please try again.',
    iconCls:     'text-destructive',
    bgCls:       'bg-destructive/5',
  },
  permission: {
    Icon:        AlertCircle,
    title:       'Access restricted',
    description: "You don't have permission to view this content. Contact your administrator.",
    iconCls:     'text-amber-500',
    bgCls:       'bg-amber-50 dark:bg-amber-950/20',
  },
};

const SIZES: Record<EmptyStateSize, { wrapper: string; iconBox: string; iconSize: number; title: string; desc: string }> = {
  sm: { wrapper: 'py-8',  iconBox: 'h-10 w-10', iconSize: 18, title: 'text-sm font-semibold',  desc: 'text-xs' },
  md: { wrapper: 'py-14', iconBox: 'h-14 w-14', iconSize: 24, title: 'text-base font-semibold', desc: 'text-sm' },
  lg: { wrapper: 'py-20', iconBox: 'h-18 w-18', iconSize: 32, title: 'text-lg font-semibold',   desc: 'text-base' },
};

const ACTION_CLS: Record<string, string> = {
  primary:   'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  secondary: 'bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground border border-border',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  icon,
  title,
  description,
  actions = [],
  size = 'md',
  className,
}) => {
  const preset   = PRESETS[variant];
  const s        = SIZES[size];
  const IconComp = icon ?? preset.Icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6',
        s.wrapper,
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {/* Icon container */}
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl mb-4',
          s.iconBox,
          preset.bgCls,
        )}
      >
        <IconComp size={s.iconSize} strokeWidth={1.5} className={preset.iconCls} />
      </div>

      {/* Text */}
      <h3 className={cn('text-foreground mb-1.5', s.title)}>
        {title ?? preset.title}
      </h3>
      <p className={cn('text-muted-foreground max-w-xs leading-relaxed', s.desc)}>
        {description ?? preset.description}
      </p>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="mt-5 flex items-center gap-2 flex-wrap justify-center">
          {actions.map((action, i) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                  'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  ACTION_CLS[action.variant ?? (i === 0 ? 'primary' : 'secondary')],
                )}
              >
                {ActionIcon && <ActionIcon size={14} strokeWidth={2} />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
