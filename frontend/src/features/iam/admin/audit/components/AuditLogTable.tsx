import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { AuditLogEntry } from '../pages/AuditLogPage';
import { DataTable } from '@/components/ui/DataTable';
import { formatIST } from '@/utils/date';

interface AuditLogTableProps {
  logs: AuditLogEntry[];
}

const getActionColor = (action: string) => {
  switch (action) {
    case 'CREATE': return 'text-[var(--color-success-text)] bg-[var(--color-success-bg)] border-[var(--color-success-border)]';
    case 'DELETE': return 'text-[var(--color-error-text)] bg-[var(--color-error-bg)] border-[var(--color-error-border)]';
    case 'UPDATE': return 'text-[var(--color-warning-text)] bg-[var(--color-warning-bg)] border-[var(--color-warning-border)]';
    default: return 'text-[var(--color-badge-text)] bg-[var(--color-badge-bg)] border-[var(--color-border)]';
  }
};

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const columns = useMemo<ColumnDef<AuditLogEntry>[]>(() => [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }) => (
        <span className="text-[var(--color-text-muted)] font-mono text-xs whitespace-nowrap">
          {formatIST(new Date(row.original.timestamp), 'PP pp')}
        </span>
      ),
    },
    {
      accessorKey: 'actor',
      header: 'Actor',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.actor}</span>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const action = row.original.action;
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getActionColor(action)}`}>
            {action}
          </span>
        );
      },
    },
    {
      accessorKey: 'resource',
      header: 'Resource',
    },
    {
      accessorKey: 'resourceId',
      header: 'Resource ID',
      cell: ({ row }) => (
        <span className="text-[var(--color-text-muted)] font-mono text-xs">
          {row.original.resourceId}
        </span>
      ),
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
      cell: ({ row }) => (
        <span className="text-[var(--color-text-muted)] font-mono text-xs">
          {row.original.ipAddress}
        </span>
      ),
    },
  ], []);

  if (logs.length === 0) {
    return <div className="p-4 text-center text-[var(--color-text-muted)]">No audit logs found.</div>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <DataTable columns={columns} data={logs} enableGlobalFilter={true} />
    </div>
  );
}
