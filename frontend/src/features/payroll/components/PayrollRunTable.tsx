import { useTranslation } from 'react-i18next';
import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { PayrollRun } from '../types/payrollTypes';

export const PayrollRunTable: React.FC<{ runs: PayrollRun[] }> = ({ runs }) => {
  const { t } = useTranslation();
  const columns = useMemo<ColumnDef<PayrollRun>[]>(
    () => [
      {
        accessorKey: 'period',
        header: 'Period',
        cell: ({ row }) => (
          <div className="text-sm font-medium text-gray-900">
            {row.original.period}
          </div>
        ),
      },
      {
        accessorKey: 'processedEmployees',
        header: 'Employees',
        cell: ({ row }) => (
          <div className="text-sm text-gray-500">
            {row.original.processedEmployees}
          </div>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: () => <div className="text-right">{t('auto.total', 'Total')}</div>,
        cell: ({ row }) => (
          <div className="text-sm text-right font-medium text-gray-900">
            ${row.original.totalAmount}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: () => <div className="text-center">{t('auto.status', 'Status')}</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              {row.original.status}
            </span>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="bg-white rounded-lg">
      <DataTable columns={columns} data={runs} enableGlobalFilter={true} searchKey="period" />
    </div>
  );
};
