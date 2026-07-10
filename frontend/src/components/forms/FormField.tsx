// src/components/forms/FormField.tsx
import React, { useId } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormFieldProps {
  /** Field label */
  label?: string;
  /** ID to link label → input. Auto-generated if omitted */
  htmlFor?: string;
  /** Error message (if any) */
  error?: string;
  /** Helper / hint text */
  helper?: string;
  /** Show green success state */
  success?: boolean;
  /** Mark as required (shows asterisk) */
  required?: boolean;
  /** Current char count for character-limit display */
  charCount?: number;
  /** Maximum character limit */
  charLimit?: number;
  /** Label displayed inline at the right side (e.g. "Optional") */
  labelTrailing?: string;
  /** Extra class on the outer wrapper */
  className?: string;
  children: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  helper,
  success,
  required = false,
  charCount,
  charLimit,
  labelTrailing,
  className,
  children,
}) => {
  const autoId = useId();
  const fieldId = htmlFor ?? autoId;

  const showError   = !!error;
  const showSuccess = success && !error;
  const showChar    = charLimit !== undefined && charCount !== undefined;
  const nearLimit   = showChar && charCount! >= charLimit! * 0.85;
  const overLimit   = showChar && charCount! > charLimit!;

  // Inject id + aria attrs into the first child element if possible
  const childWithId = React.Children.map(children, (child, i) => {
    if (i === 0 && React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        id:             fieldId,
        'aria-invalid':  showError ? 'true' : undefined,
        'aria-required': required ? 'true' : undefined,
        'aria-describedby': [
          showError   ? `${fieldId}-error`  : '',
          helper      ? `${fieldId}-helper` : '',
        ].filter(Boolean).join(' ') || undefined,
      });
    }
    return child;
  });

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {/* Label row */}
      {(label || labelTrailing) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={fieldId}
              className="block text-sm font-medium text-foreground leading-none cursor-pointer"
            >
              {label}
              {required && (
                <span className="ml-1 text-destructive" aria-hidden="true">*</span>
              )}
            </label>
          )}
          {labelTrailing && (
            <span className="text-xs text-muted-foreground">{labelTrailing}</span>
          )}
        </div>
      )}

      {/* Input slot */}
      {childWithId}

      {/* Footer row */}
      {(showError || helper || showSuccess || showChar) && (
        <div className="flex items-start justify-between gap-2">
          {/* Left: error or helper */}
          <div className="flex items-start gap-1.5 min-w-0">
            {showError && (
              <>
                <AlertCircle
                  size={13}
                  className="shrink-0 mt-0.5 text-destructive"
                  aria-hidden="true"
                />
                <p
                  id={`${fieldId}-error`}
                  role="alert"
                  className="text-xs font-medium text-destructive leading-relaxed"
                >
                  {error}
                </p>
              </>
            )}
            {showSuccess && !showError && (
              <CheckCircle2
                size={13}
                className="shrink-0 mt-0.5 text-emerald-500"
                aria-hidden="true"
              />
            )}
            {helper && !showError && (
              <p
                id={`${fieldId}-helper`}
                className="text-xs text-muted-foreground leading-relaxed"
              >
                {helper}
              </p>
            )}
          </div>

          {/* Right: char count */}
          {showChar && (
            <span
              className={cn(
                'shrink-0 text-xs tabular-nums font-medium',
                overLimit ? 'text-destructive font-bold'
                : nearLimit ? 'text-warning'
                : 'text-muted-foreground',
              )}
              aria-live="polite"
            >
              {charCount}/{charLimit}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FormField;
