// yss_orbit/frontend/src/components/ui/Card.tsx
import React from 'react';
import { cn } from '../../utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  'rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow',
  {
    variants: {
      variant: {
        default: 'shadow-sm',
        elevated: 'shadow-md border-transparent dark:border-border',
        bordered: 'shadow-none',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>, VariantProps<typeof cardVariants> {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  bodyStyle?: React.CSSProperties;
  bodyClassName?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, title, actions, footer, noPadding, bodyStyle, bodyClassName, children, ...props }, ref) => {
    // If legacy props are used, we render the composed version to maintain backward compatibility.
    // If they just pass children and no legacy props, we render a clean div for composable usage.
    const hasLegacyProps = title !== undefined || actions !== undefined || footer !== undefined || noPadding !== undefined || bodyStyle !== undefined || bodyClassName !== undefined;
    
    if (!hasLegacyProps) {
      return (
        <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props}>
          {children}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props}>
        {(title || actions) && (
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b p-4 sm:px-6">
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </CardHeader>
        )}
        <CardContent 
          className={cn(!noPadding ? "p-6" : "p-0", bodyClassName)} 
          style={bodyStyle}
        >
          {children}
        </CardContent>
        {footer && (
          <CardFooter className="bg-muted/30 border-t p-4 sm:px-6">
            {footer}
          </CardFooter>
        )}
      </div>
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
