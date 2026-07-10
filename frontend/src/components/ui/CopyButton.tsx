// src/components/ui/CopyButton.tsx
// Shared copy-to-clipboard chip component.
// Consolidates duplicate CopyButton/CopyChip implementations that existed in
// BusinessDomainPage, OrganizationListPage, and BusinessDomainViewModal.
//
// Usage:
//   <CopyButton text={domain.code} label="domain code" />
//   <CopyButton text={domain.id} label="Domain UUID" variant="chip" />

import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

export interface CopyButtonProps {
  /** The text to copy to clipboard */
  text: string;
  /** Human-readable label used in aria-label and title */
  label?: string;
  /** "chip" = pill-shaped with text visible (default); "icon" = icon only */
  variant?: 'chip' | 'icon';
  /** Additional CSS classes */
  className?: string;
  /** Prevent click from bubbling (useful inside clickable table rows / cards) */
  stopPropagation?: boolean;
}

/**
 * CopyButton — renders a copy-to-clipboard chip or icon button.
 * Shows a ✓ check for 1.5s after copy then resets.
 *
 * @example
 * <CopyButton text="BDOM-RTL" label="domain code" />
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label,
  variant = 'chip',
  className = '',
  stopPropagation = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      if (stopPropagation) e.stopPropagation();
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    },
    [text, stopPropagation]
  );

  const ariaLabel = copied
    ? 'Copied!'
    : `Copy ${label || text}`;

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={[
          'inline-flex items-center justify-center rounded-lg p-1.5 transition-colors',
          'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
          'dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
          className,
        ].join(' ')}
      >
        {copied
          ? <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
          : <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        }
      </button>
    );
  }

  // Default: chip variant
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={[
        'group inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors',
        'font-mono text-[11px] font-bold',
        'text-violet-700 dark:text-violet-400',
        'bg-violet-50 dark:bg-violet-900/20',
        'ring-1 ring-violet-200 dark:ring-violet-800/50',
        'hover:bg-violet-100 dark:hover:bg-violet-900/40',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
        className,
      ].join(' ')}
    >
      <span className="truncate max-w-[200px]">{text}</span>
      {copied
        ? <Check className="h-3 w-3 text-emerald-500 shrink-0" aria-hidden="true" />
        : <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" aria-hidden="true" />
      }
    </button>
  );
};
