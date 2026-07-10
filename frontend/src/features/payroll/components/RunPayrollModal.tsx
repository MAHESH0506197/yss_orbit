import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\features\payroll\components\RunPayrollModal.tsx
import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { useRunPayroll } from '../api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface RunPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RunPayrollModal: React.FC<RunPayrollModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { mutate: runPayroll, isPending } = useRunPayroll();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    runPayroll(
      { month, year },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (err: Error) => {
          setErrorMsg(err.message || 'Failed to run payroll');
        }
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('auto.run_payroll', 'Run Payroll')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-[var(--color-error-bg)] text-[var(--color-error)] text-sm rounded">
            {errorMsg}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t('auto.month', 'Month')}</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full p-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t('auto.year', 'Year')}</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full p-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)] mt-4">
          {t('auto.running_payroll_will_calculate_salaries_deductions', 'Running payroll will calculate salaries, deductions, and allowances for all active employees in the Business Unit for the selected period.')}
        </p>

        <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium transition-colors"
            disabled={isPending}
          >
            {t('auto.cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-90 font-medium transition-opacity disabled:opacity-50"
          >
            {isPending ? 'Processing...' : 'Confirm Run'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
