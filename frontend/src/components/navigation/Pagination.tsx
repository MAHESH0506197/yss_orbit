// src/components/navigation/Pagination.tsx
import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatIST } from '@/utils/date';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginationProps {
  /** Current page (1-indexed) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Total record count */
  totalItems?: number;
  /** Items per page (for "Showing X–Y of Z" label) */
  pageSize?: number;
  /** Fires when a page button is clicked */
  onPageChange: (page: number) => void;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Fires when page size changes */
  onPageSizeChange?: (size: number) => void;
  /** Compact mode — hides record count and page-size selector */
  compact?: boolean;
  /** Show first/last buttons */
  showFirstLast?: boolean;
  /** Max page buttons to show (default 5) */
  siblingCount?: number;
  className?: string;
}

// ─── Page range builder ───────────────────────────────────────────────────────

function buildRange(page: number, total: number, siblings: number): (number | 'ellipsis')[] {
  if (total <= 1) return [1];

  const delta    = siblings + 2; // siblings on each side + first/last
  const left     = Math.max(2, page - siblings);
  const right    = Math.min(total - 1, page + siblings);
  const range: (number | 'ellipsis')[] = [];

  range.push(1);

  if (left > 2)     range.push('ellipsis');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push('ellipsis');

  if (total > 1) range.push(total);

  return range;
}

// ─── PagBtn ───────────────────────────────────────────────────────────────────

interface PagBtnProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  'aria-label'?: string;
  children: React.ReactNode;
}

function PagBtn({ onClick, disabled, active, children, ...rest }: PagBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2',
        'text-sm font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'disabled:opacity-40 disabled:pointer-events-none',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  compact = false,
  showFirstLast = true,
  siblingCount = 1,
  className,
}) => {
  const range = buildRange(page, totalPages, siblingCount);

  // "Showing X–Y of Z" label
  const from = pageSize ? (page - 1) * pageSize + 1 : undefined;
  const to   = pageSize && totalItems ? Math.min(page * pageSize, totalItems) : undefined;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3',
        compact ? 'justify-center' : 'justify-between',
        className,
      )}
    >
      {/* Left: record info + page size selector */}
      {!compact && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {from !== undefined && to !== undefined && totalItems !== undefined && (
            <span className="tabular-nums">
              Showing <strong className="text-foreground">{from}–{to}</strong> of{' '}
              <strong className="text-foreground">{formatIST(totalItems, 'PP pp')}</strong>
            </span>
          )}

          {pageSizeOptions && onPageSizeChange && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs">Rows per page:</span>
              <select
                value={pageSize}
                onChange={e => onPageSizeChange(Number(e.target.value))}
                className={cn(
                  'h-7 rounded-lg border border-input bg-background px-2 text-xs font-medium text-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                )}
              >
                {pageSizeOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Right: page buttons */}
      <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
        {showFirstLast && (
          <PagBtn
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            aria-label="First page"
          >
            <ChevronsLeft size={14} />
          </PagBtn>
        )}

        <PagBtn
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </PagBtn>

        {range.map((item, i) =>
          item === 'ellipsis' ? (
            <span key={`e-${i}`} className="flex h-8 w-8 items-center justify-center text-muted-foreground">
              <MoreHorizontal size={14} />
            </span>
          ) : (
            <PagBtn
              key={item}
              onClick={() => onPageChange(item)}
              active={item === page}
              aria-label={`Page ${item}`}
            >
              {item}
            </PagBtn>
          ),
        )}

        <PagBtn
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </PagBtn>

        {showFirstLast && (
          <PagBtn
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            aria-label="Last page"
          >
            <ChevronsRight size={14} />
          </PagBtn>
        )}
      </div>
    </div>
  );
};

export default Pagination;
