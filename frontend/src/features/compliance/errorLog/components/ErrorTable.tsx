// yss_orbit\frontend\src\modules\errorLog\components\ErrorTable.tsx
import React, { useMemo } from 'react';
import { ErrorLogEntry } from '../types/errorLogTypes';
import { getSeverityColor } from '../utils/errorLogHelpers';
import { Link } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { formatIST } from '@/utils/date';

export const ErrorTable: React.FC<{ errors: ErrorLogEntry[] }> = ({ errors }) => {
  const columns = useMemo<ColumnDef<ErrorLogEntry>[]>(() => [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }) => <span className="text-sm text-gray-500">{formatIST(new Date(row.original.timestamp), 'PP pp')}</span>,
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => {
        const severity = row.original.severity;
        return (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(severity)}`}>
            {severity}
          </span>
        );
      },
    },
    {
      accessorKey: 'errorCode',
      header: 'Code',
      cell: ({ row }) => <span className="text-sm font-medium text-gray-900">{row.original.errorCode}</span>,
    },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) => <div className="text-sm text-gray-500 truncate max-w-xs">{row.original.message}</div>,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm font-medium">
          <Link to={`/platform/errors/${row.original.id}`} className="text-[var(--primary-color)] hover:underline">View</Link>
        </div>
      ),
    },
  ], []);

  return (
    <DataTable 
      columns={columns} 
      data={errors} 
      enableGlobalFilter={true} 
    />
  );
};
