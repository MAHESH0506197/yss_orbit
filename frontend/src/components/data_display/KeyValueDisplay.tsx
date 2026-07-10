// src/components/data_display/KeyValueDisplay.tsx
import React, { useState } from 'react';
import { Copy, Check, LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KVItem {
  key: string;
  label: string;
  value: React.ReactNode;
  /** If provided, renders a copy-to-clipboard button */
  copyValue?: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Hide this entry */
  hidden?: boolean;
  /** Span full width in grid mode */
  fullWidth?: boolean;
}

export interface KeyValueDisplayProps {
  items: KVItem[];
  /** Layout mode */
  layout?: 'list' | 'grid' | 'inline';
  /** Number of grid columns */
  columns?: 2 | 3 | 4;
  /** Alternate row backgrounds in list mode */
  striped?: boolean;
  /** Show loading skeletons */
  loading?: boolean;
  /** Number of skeleton rows when loading */
  loadingRows?: number;
  /** Card container */
  card?: boolean;
  /** Card title */
  title?: string;
  className?: string;
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : 'Copy to clipboard'}
      className={cn(
        'ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded transition-all duration-150',
        'text-muted-foreground hover:text-foreground hover:bg-muted',
        'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none',
      )}
    >
      {copied
        ? <Check size={11} strokeWidth={2.5} className="text-emerald-500" />
        : <Copy  size={11} strokeWidth={2} />
      }
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function KVSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-3 w-28 rounded bg-muted animate-pulse shrink-0" />
          <div className="h-3 w-40 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ─── Single KV item ──────────────────────────────────────────────────────────

function KVRow({ item, striped, idx, layout }: {
  item: KVItem; striped: boolean; idx: number; layout: string;
}) {
  const Icon = item.icon;

  if (layout === 'inline') {
    return (
      <div
        className={cn(
          'group flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm',
          striped && idx % 2 === 0 ? 'bg-muted/30' : '',
        )}
      >
        <span className="flex items-center gap-1.5 text-muted-foreground font-medium shrink-0">
          {Icon && <Icon size={13} className="shrink-0" />}
          {item.label}
        </span>
        <span className="flex items-center text-foreground text-right truncate min-w-0">
          {item.value}
          {item.copyValue && <CopyBtn text={item.copyValue} />}
        </span>
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div
        className={cn(
          'group flex items-start gap-4 px-3 py-2.5 rounded-lg text-sm',
          striped && idx % 2 === 0 ? 'bg-muted/30' : '',
        )}
      >
        <span className="w-36 shrink-0 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
          {Icon && <Icon size={12} className="shrink-0" />}
          {item.label}
        </span>
        <span className="flex items-center gap-1 text-foreground break-all min-w-0">
          {item.value}
          {item.copyValue && <CopyBtn text={item.copyValue} />}
        </span>
      </div>
    );
  }

  // grid — rendered by parent
  return null;
}

// ─── Grid item ───────────────────────────────────────────────────────────────

function KVGridItem({ item }: { item: KVItem }) {
  const Icon = item.icon;
  return (
    <div
      className={cn(
        'group rounded-lg bg-muted/20 border border-border/60 px-3.5 py-3',
        item.fullWidth ? 'col-span-full' : '',
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {Icon && <Icon size={11} className="shrink-0" />}
        {item.label}
      </div>
      <div className="flex items-center gap-1 text-sm font-medium text-foreground break-all">
        {item.value}
        {item.copyValue && <CopyBtn text={item.copyValue} />}
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

const GRID_COLS: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export const KeyValueDisplay: React.FC<KeyValueDisplayProps> = ({
  items,
  layout = 'list',
  columns = 2,
  striped = true,
  loading = false,
  loadingRows = 4,
  card = false,
  title,
  className,
}) => {
  const visible = items.filter(i => !i.hidden);

  const content = loading ? (
    <KVSkeleton rows={loadingRows} />
  ) : layout === 'grid' ? (
    <div className={cn('grid gap-2.5', GRID_COLS[columns])}>
      {visible.map(item => <KVGridItem key={item.key} item={item} />)}
    </div>
  ) : (
    <div className="space-y-0.5">
      {visible.map((item, idx) => (
        <KVRow key={item.key} item={item} striped={striped} idx={idx} layout={layout} />
      ))}
    </div>
  );

  if (card) {
    return (
      <div className={cn('rounded-xl border border-border bg-card shadow-sm overflow-hidden', className)}>
        {title && (
          <div className="px-4 py-3 border-b border-border bg-muted/20">
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          </div>
        )}
        <div className="p-4">{content}</div>
      </div>
    );
  }

  return <div className={cn(className)}>{content}</div>;
};

export default KeyValueDisplay;
