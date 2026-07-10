import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\features\payroll\pages\PayrollPage.tsx
import React, { useState } from 'react';
import { usePayrollRuns } from '@/features/payroll/api';
import { PayrollTable } from '@/features/payroll/components/PayrollTable';
import { RunPayrollModal } from '@/features/payroll/components/RunPayrollModal';
import { Skeleton } from '../.././components/ui/Skeleton';
import { ErrorState } from '../.././components/ui/ErrorState';
import { AnyPermissionGate } from '../.././components/auth/PermissionGate';

export const PayrollPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);

  const { data: payrollRuns, isLoading, error, refetch } = usePayrollRuns(selectedYear);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto min-h-screen bg-[var(--color-background)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">{t('auto.payroll_management', 'Payroll Management')}</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">{t('auto.manage_salary_slips_and_payroll_runs_for_the_busin', 'Manage salary slips and payroll runs for the Business Unit.')}</p>
        </div>
        <AnyPermissionGate permissions={['run_payroll']}>
          <button
            onClick={() => setIsRunModalOpen(true)}
            className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
          >
            {t('auto.run_payroll', 'Run Payroll')}
          </button>
        </AnyPermissionGate>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{t('auto.payroll_history', 'Payroll History')}</h2>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">{t('auto.year', 'Year:')}</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="p-1.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState error={error as Error} onRetry={() => refetch()} />
            </div>
          ) : payrollRuns && payrollRuns.length > 0 ? (
            <PayrollTable runs={payrollRuns} />
          ) : (
            <div className="p-12 text-center text-[var(--color-text-secondary)]">
              {t('auto.no_payroll_runs_found_for', 'No payroll runs found for')} {selectedYear}.
            </div>
          )}
        </div>
      </div>

      <RunPayrollModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
      />
    </div>
  );
};

// Default export if required for React.lazy
export default PayrollPage;
