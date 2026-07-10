// src/components/platform/CopyChip.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Copyable code/text chip with hover-reveal copy button.
// Replaces the inline CopyChip/CopyButton pattern duplicated across BD, Org, BU pages.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export interface CopyChipProps {
  /** The value to copy to clipboard */
  value: string;
  /** Screen-reader label for the copy button. Defaults to the value */
  label?: string;
  /** Render value in monospace font. Default true */
  mono?: boolean;
  /** Max chars to display before truncating with ellipsis. No truncation by default */
  truncate?: number;
  /** Extra Tailwind classes on the button */
  className?: string;
}

export function CopyChip({ value, label, mono = true, truncate, className }: CopyChipProps) {
  const [copied, setCopied] = useState(false);

  const doCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      toast.success('Copied!', { duration: 1200, icon: '📋' });
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {
      toast.error('Failed to copy.');
    });
  };

  const displayText =
    truncate && value.length > truncate
      ? `${value.slice(0, Math.floor(truncate * 0.6))}…${value.slice(-Math.floor(truncate * 0.3))}`
      : value;

  return (
    <button
      type="button"
      onClick={doCopy}
      aria-label={`Copy ${label ?? value}`}
      title={copied ? 'Copied!' : `Copy ${label ?? value}`}
      className={[
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs ring-1 transition-all duration-150 font-medium',
        mono ? 'font-mono' : '',
        copied
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-400 dark:ring-emerald-800'
          : 'bg-gray-50 text-gray-600 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 hover:bg-violet-50 hover:text-violet-700 hover:ring-violet-200 dark:hover:bg-violet-900/20 dark:hover:text-violet-300 dark:hover:ring-violet-800',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
        className ?? '',
      ].filter(Boolean).join(' ')}
    >
      {displayText}
      {copied
        ? <Check className="h-3 w-3 shrink-0 text-emerald-500" aria-hidden="true" />
        : <Copy className="h-3 w-3 shrink-0 opacity-40" aria-hidden="true" />
      }
    </button>
  );
}

export default CopyChip;
