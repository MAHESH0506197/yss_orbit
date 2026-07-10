// src/components/data_display/DataTable.tsx
import React, { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  RowSelectionState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { EmptyState, EmptyStateVariant } from './EmptyState';
import { LoadingSpinner } from '../feedback/LoadingSpinner';
import { formatIST } from '@/utils/date';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Loading state — shows skeleton rows */
  loading?: boolean;
  /** Number of skeleton rows */
  loadingRows?: number;
  /** Global filter value (controlled) */
  globalFilter?: string;
  /** Enable row selection checkboxes */
  selectable?: boolean;
  /** Fires when selection changes */
  onSelectionChange?: (rows: TData[]) => void;
  /** Empty state preset */
  emptyVariant?: EmptyStateVariant;
  /** Empty state title override */
  emptyTitle?: string;
  /** Empty state description override */
  emptyDescription?: string;
  /** Empty state action */
  emptyAction?: { label: string; onClick: () => void };
  /** Default page size */
  pageSize?: number;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Hide pagination */
  hidePagination?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Dense (compact) rows */
  dense?: boolean;
  /** Row click handler */
  onRowClick?: (row: TData) => void;
  className?: string;
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className={cn(
            'h-3.5 rounded bg-muted animate-pulse',
            i === 0 ? 'w-32' : i === cols - 1 ? 'w-16' : 'w-full',
          )} />
        </td>
      ))}
    </tr>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  loadingRows = 6,
  globalFilter,
  selectable = false,
  onSelectionChange,
  emptyVariant = 'default',
  emptyTitle,
  emptyDescription,
  emptyAction,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  hidePagination = false,
  striped = false,
  dense = false,
  onRowClick,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting]           = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnFilters]                 = useState<ColumnFiltersState>([]);

  // Selection column prepended when selectable
  const allColumns: ColumnDef<TData, TValue>[] = selectable
    ? [
        {
          id: '__select__',
          header: ({ table }) => (
            <input
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              ref={(el) => {
                if (el) el.indeterminate = table.getIsSomePageRowsSelected();
              }}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
              aria-label="Select all rows"
            />
          ),
          cell: ({ row }) => (
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
              aria-label="Select row"
            />
          ),
          size: 40,
          enableSorting: false,
        } as ColumnDef<TData, TValue>,
        ...columns,
      ]
    : columns;

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel:       getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    onSortingChange:       setSorting,
    onRowSelectionChange:  (updater) => {
      setRowSelection(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (onSelectionChange) {
          const selected = table.getRowModel().rows
            .filter((_, i) => next[i])
            .map(r => r.original);
          onSelectionChange(selected);
        }
        return next;
      });
    },
    state: {
      sorting,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: { pageSize },
    },
    enableRowSelection: selectable,
  });

  const { pageIndex } = table.getState().pagination;
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const from          = pageIndex * table.getState().pagination.pageSize + 1;
  const to            = Math.min((pageIndex + 1) * table.getState().pagination.pageSize, totalFiltered);

  const isClickable = !!onRowClick;
  const cellPad     = dense ? 'px-4 py-2' : 'px-4 py-3';

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Header */}
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id} className="border-b border-border bg-muted/40">
                  {hg.headers.map(header => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      className={cn(
                        'px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                        header.column.getCanSort() && 'cursor-pointer select-none hover:text-foreground',
                      )}
                      onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                      aria-sort={
                        header.column.getIsSorted() === 'asc'  ? 'ascending'
                        : header.column.getIsSorted() === 'desc' ? 'descending'
                        : undefined
                      }
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="ml-0.5 text-muted-foreground/50">
                              {header.column.getIsSorted() === 'asc'  ? <ChevronUp   size={13} /> :
                               header.column.getIsSorted() === 'desc' ? <ChevronDown size={13} /> :
                               <ChevronsUpDown size={13} />}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: loadingRows }).map((_, i) => (
                  <SkeletonRow key={i} cols={allColumns.length} />
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={allColumns.length}>
                    <EmptyState
                      variant={emptyVariant}
                      title={emptyTitle}
                      description={emptyDescription}
                      size="sm"
                      actions={emptyAction ? [emptyAction] : []}
                    />
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, rowIdx) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    onClick={isClickable ? () => onRowClick!(row.original) : undefined}
                    className={cn(
                      'transition-colors duration-100',
                      striped && rowIdx % 2 !== 0 ? 'bg-muted/20' : '',
                      row.getIsSelected() ? 'bg-primary/5' : '',
                      isClickable ? 'cursor-pointer hover:bg-muted/50' : 'hover:bg-muted/30',
                    )}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className={cn('align-middle text-foreground', cellPad)}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!hidePagination && !loading && totalFiltered > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          {/* Left */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="tabular-nums">
              Showing{' '}
              <strong className="text-foreground">{from}–{to}</strong> of{' '}
              <strong className="text-foreground">{formatIST(totalFiltered, 'PP pp')}</strong>
            </span>
            {selectable && Object.keys(rowSelection).length > 0 && (
              <span className="text-primary font-semibold">
                {Object.keys(rowSelection).length} selected
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={e => table.setPageSize(Number(e.target.value))}
                className="h-7 rounded-lg border border-input bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {pageSizeOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: page buttons */}
          <div className="flex items-center gap-1" role="navigation" aria-label="Table pagination">
            {[
              { icon: ChevronsLeft,  label: 'First',    action: () => table.setPageIndex(0),              disabled: !table.getCanPreviousPage() },
              { icon: ChevronLeft,   label: 'Previous', action: () => table.previousPage(),               disabled: !table.getCanPreviousPage() },
              { icon: ChevronRight,  label: 'Next',     action: () => table.nextPage(),                   disabled: !table.getCanNextPage() },
              { icon: ChevronsRight, label: 'Last',     action: () => table.setPageIndex(table.getPageCount() - 1), disabled: !table.getCanNextPage() },
            ].map(({ icon: Icon, label, action, disabled }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={action}
                disabled={disabled}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground',
                  'hover:bg-muted hover:text-foreground transition-colors duration-100',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'disabled:opacity-40 disabled:pointer-events-none',
                )}
              >
                <Icon size={14} />
              </button>
            ))}

            <span className="px-2 text-xs text-muted-foreground tabular-nums">
              {pageIndex + 1} / {table.getPageCount()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
