import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\features\payroll\components\PayrollTable.tsx
import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PayrollRun } from '../types';
import { PayslipModal } from './PayslipModal';
import { DataTable } from '../../../components/ui/DataTable';
import { formatIST } from '@/utils/date';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const PayrollTable: React.FC<{ runs: PayrollRun[] }> = ({ runs }) => {
  const { t } = useTranslation();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-[var(--color-success)] text-white';
      case 'processed': return 'bg-[var(--color-primary)] text-white';
      default: return 'bg-[var(--color-warning)] text-black';
    }
  };

  const columns = useMemo<ColumnDef<PayrollRun>[]>(() => [
    {
      accessorFn: (row) => `${MONTHS[row.month - 1]} ${row.year}`,
      id: 'period',
      header: 'Period',
      cell: (info) => (
        <span className="font-medium whitespace-nowrap text-[var(--color-text-primary)]">
          {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'totalEmployees',
      header: 'Employees',
      cell: (info) => (
        <span className="text-[var(--color-text-secondary)]">
          {info.getValue() as number}
        </span>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total Amount',
      cell: (info) => (
        <span className="font-medium text-[var(--color-text-secondary)]">
          ${(info.getValue() as number).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => {
        const status = info.getValue() as string;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(status)}`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'processedAt',
      header: 'Processed At',
      cell: (info) => {
        const val = info.getValue() as string;
        return (
          <span className="text-[var(--color-text-secondary)] text-sm">
            {val ? formatIST(new Date(val), 'PPP') : '-'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">{t('auto.actions', 'Actions')}</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <button
            onClick={() => setSelectedRunId(row.original.id)}
            className="px-3 py-1.5 text-sm text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:bg-opacity-10 rounded transition-colors font-medium whitespace-nowrap"
          >
            {t('auto.view_payslips', 'View Payslips')}
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <>
      <DataTable 
        columns={columns} 
        data={runs} 
        enableGlobalFilter={true} 
      />

      <PayslipModal
        isOpen={!!selectedRunId}
        onClose={() => setSelectedRunId(null)}
        payrollRunId={selectedRunId}
      />
    </>
  );
};
