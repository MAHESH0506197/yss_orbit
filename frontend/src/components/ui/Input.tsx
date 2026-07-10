// yss_orbit/frontend/src/components/ui/Input.tsx
import React, { useId, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Eye, EyeOff, Loader2, X, CheckCircle2 } from 'lucide-react';

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
  {
    variants: {
      variant: {
        default: '',
        filled: 'bg-muted border-transparent focus-visible:bg-background',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-emerald-500 focus-visible:ring-emerald-500',
      },
      size: {
        default: 'h-10 px-3 py-2 text-sm',
        sm: 'h-8 px-2 py-1 text-xs',
        lg: 'h-12 px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  showPasswordToggle?: boolean;
  isLoading?: boolean;
  isSuccess?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      hint,
      variant,
      size,
      iconLeft,
      iconRight,
      showPasswordToggle = false,
      isLoading = false,
      isSuccess = false,
      clearable = false,
      onClear,
      id: propId,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = propId ?? generatedId;
    const [showPassword, setShowPassword] = useState(false);
    
    // For uncontrolled inputs to still show the clear button correctly if users type
    const [internalHasValue, setInternalHasValue] = useState(
      Boolean(props.defaultValue)
    );

    const isError = variant === 'error' || !!error;
    const currentVariant = isError ? 'error' : isSuccess ? 'success' : variant;
    const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

    // Check if input has value (controlled or uncontrolled)
    const isControlled = value !== undefined;
    const hasValue = isControlled 
      ? value !== null && String(value).length > 0 
      : internalHasValue;
      
    const showClear = clearable && hasValue && !isLoading;

    // Handle size variants for icon spacing
    const isSm = size === 'sm';
    const isLg = size === 'lg';
    
    const iconWrapperClass = "absolute flex h-full items-center justify-center text-muted-foreground";
    const leftIconClass = cn(iconWrapperClass, "left-0", isSm ? "w-8" : isLg ? "w-12" : "w-10");
    const rightIconClass = cn(iconWrapperClass, "right-0", isSm ? "w-8" : isLg ? "w-12" : "w-10");

    const paddingLeftClass = iconLeft ? (isSm ? 'pl-8' : isLg ? 'pl-12' : 'pl-10') : '';
    
    // Right padding logic
    const hasRightElement = iconRight || showPasswordToggle || showClear || isLoading || isSuccess;
    const paddingRightClass = hasRightElement ? (isSm ? 'pr-8' : isLg ? 'pr-12' : 'pr-10') : '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalHasValue(e.target.value.length > 0);
      }
      onChange?.(e);
    };

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              isSm ? 'text-xs' : 'text-sm',
              isError ? 'text-destructive' : 'text-foreground'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {iconLeft && (
            <div className={leftIconClass}>
              {iconLeft}
            </div>
          )}
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant: currentVariant, size }),
              paddingLeftClass,
              paddingRightClass,
              className
            )}
            ref={ref}
            id={id}
            value={value}
            onChange={handleChange}
            aria-invalid={isError ? 'true' : 'false'}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            {...props}
          />
          
          {/* Priority-based right side rendering */}
          {isLoading ? (
            <div className={rightIconClass} title="Loading...">
              <Loader2 className={cn("animate-spin text-muted-foreground", isSm ? "h-3 w-3" : "h-4 w-4")} />
            </div>
          ) : showClear ? (
            <button
              type="button"
              className={cn(rightIconClass, "hover:text-foreground transition-colors cursor-pointer")}
              onClick={(e) => {
                e.preventDefault();
                onClear?.();
              }}
              aria-label="Clear input"
              tabIndex={-1}
            >
              <X className={isSm ? "h-3 w-3" : "h-4 w-4"} />
            </button>
          ) : showPasswordToggle || type === 'password' ? (
            <button
              type="button"
              className={cn(rightIconClass, "hover:text-foreground transition-colors cursor-pointer")}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className={isSm ? "h-3 w-3" : "h-4 w-4"} /> : <Eye className={isSm ? "h-3 w-3" : "h-4 w-4"} />}
            </button>
          ) : isSuccess ? (
            <div className={cn(rightIconClass, "text-emerald-500")} title="Success">
              <CheckCircle2 className={isSm ? "h-3.5 w-3.5" : "h-4 w-4"} />
            </div>
          ) : iconRight ? (
            <div className={rightIconClass}>
              {iconRight}
            </div>
          ) : null}
        </div>
        {error && (
          <p id={`${id}-error`} className={cn("font-medium text-destructive", isSm ? "text-[0.7rem]" : "text-[0.8rem]")}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${id}-hint`} className={cn("text-muted-foreground", isSm ? "text-[0.7rem]" : "text-[0.8rem]")}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
