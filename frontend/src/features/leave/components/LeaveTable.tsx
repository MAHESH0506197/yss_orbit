import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\features\leave\components\LeaveTable.tsx
import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { LeaveRequest } from '../types';
import { useUpdateLeaveStatus } from '../api';
import { AnyPermissionGate } from '../../../components/auth/PermissionGate';
import { DataTable } from '../../../components/ui/DataTable';
import { formatIST } from '@/utils/date';

export const LeaveTable: React.FC<{ leaves: LeaveRequest[] }> = ({ leaves }) => {
  const { t } = useTranslation();
  const { mutate: updateStatus, isPending } = useUpdateLeaveStatus();

  const columns = useMemo<ColumnDef<LeaveRequest>[]>(
    () => [
      {
        accessorKey: 'employeeName',
        header: 'Employee',
        cell: ({ row }) => (
          <span className="text-[var(--color-text-primary)] font-medium">
            {row.original.employeeName}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary)] bg-opacity-10 text-[var(--color-primary)] capitalize">
            {row.original.type}
          </span>
        ),
      },
      {
        id: 'duration',
        header: 'Duration',
        cell: ({ row }) => (
          <span className="text-[var(--color-text-secondary)] text-sm">
            {formatIST(new Date(row.original.startDate), 'PPP')} - {formatIST(new Date(row.original.endDate), 'PPP')}
          </span>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <div className="text-[var(--color-text-secondary)] text-sm max-w-[200px] truncate" title={row.original.reason}>
            {row.original.reason}
          </div>
        ),
      },
      {
        accessorKey: 'appliedAt',
        header: 'Applied At',
        cell: ({ row }) => (
          <span className="text-[var(--color-text-secondary)] text-sm">
            {formatIST(new Date(row.original.appliedAt), 'PPP')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">{t('auto.actions', 'Actions')}</div>,
        cell: ({ row }) => {
          const leave = row.original;
          return (
            <div className="text-right space-x-2">
              {leave.status === 'pending' && (
                <AnyPermissionGate permissions={['manage_leaves']}>
                  <button
                    onClick={() => updateStatus({ id: leave.id, status: 'approved' })}
                    disabled={isPending}
                    className="px-3 py-1.5 text-sm bg-[var(--color-success)] text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {t('auto.approve', 'Approve')}
                  </button>
                  <button
                    onClick={() => updateStatus({ id: leave.id, status: 'rejected' })}
                    disabled={isPending}
                    className="px-3 py-1.5 text-sm bg-[var(--color-error)] text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {t('auto.reject', 'Reject')}
                  </button>
                </AnyPermissionGate>
              )}
              {leave.status !== 'pending' && (
                <span className="text-[var(--color-text-secondary)] text-sm capitalize">
                  {leave.status}
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [updateStatus, isPending]
  );

  return (
    <div className="overflow-x-auto">
      <DataTable 
        columns={columns} 
        data={leaves} 
        enableGlobalFilter={true} 
      />
    </div>
  );
};
