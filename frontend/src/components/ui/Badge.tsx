// yss_orbit/frontend/src/components/ui/Badge.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-sans font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground border border-border',
        primary: 'bg-primary/10 text-primary border border-primary/20',
        secondary: 'bg-secondary text-secondary-foreground border border-transparent',
        success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20',
        error: 'bg-destructive/15 text-destructive border border-destructive/20',
        info: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20',
        outline: 'text-foreground border border-input',
      },
      size: {
        sm: 'text-[0.65rem] px-2 h-[18px]',
        md: 'text-xs px-2.5 h-[22px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({
  className,
  variant,
  size,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            variant === 'success' && 'bg-emerald-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'error' && 'bg-destructive',
            variant === 'info' && 'bg-blue-500',
            variant === 'primary' && 'bg-primary',
            (!variant || variant === 'default' || variant === 'secondary' || variant === 'outline') && 'bg-foreground/50'
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
