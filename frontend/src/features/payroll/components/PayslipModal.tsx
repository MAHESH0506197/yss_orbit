import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\features\payroll\components\PayslipModal.tsx
import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { usePayslips } from '../api/usePayroll';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ErrorState } from '../../../components/ui/ErrorState';
import { formatIST } from '@/utils/date';

interface Payslip {
  id: string;
  employeeName: string;
  employeeId: string;
  netPay: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  [key: string]: any;
}

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payrollRunId: string | null;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({ isOpen, onClose, payrollRunId }) => {
  const { t } = useTranslation();
  const { data: payslips, isLoading, error, refetch } = usePayslips(payrollRunId || '');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('auto.employee_payslips', 'Employee Payslips')}>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {!payrollRunId ? null : isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : error ? (
          <ErrorState error={error as Error} onRetry={() => refetch()} />
        ) : payslips && payslips.length > 0 ? (
          <div className="space-y-4">
            {(payslips as Payslip[]).map((payslip: Payslip) => (
              
              <div key={payslip.id} className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)]">
                <div className="flex justify-between items-start mb-3 border-b border-[var(--color-border)] pb-2">
                  <div>
                    
                    <h3 className="font-semibold text-[var(--color-text-primary)]">{payslip.employeeName}</h3>
                    
                    <p className="text-xs text-[var(--color-text-secondary)]">{t('auto.id', 'ID:')} {payslip.employeeId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">{t('auto.net_pay', 'Net Pay')}</p>
                    
                    <p className="text-lg font-bold text-[var(--color-primary)]">${formatIST(payslip.netPay, 'PP pp')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-[var(--color-text-secondary)] text-xs">{t('auto.basic', 'Basic')}</p>
                    
                    <p className="text-[var(--color-text-primary)] font-medium">${formatIST(payslip.basicSalary, 'PP pp')}</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-secondary)] text-xs">{t('auto.allowances', 'Allowances')}</p>
                    
                    <p className="text-[var(--color-success)] font-medium">+${formatIST(payslip.allowances, 'PP pp')}</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-secondary)] text-xs">{t('auto.deductions', 'Deductions')}</p>
                    
                    <p className="text-[var(--color-error)] font-medium">-${formatIST(payslip.deductions, 'PP pp')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-[var(--color-text-secondary)]">
            {t('auto.no_payslips_generated_for_this_run_yet', 'No payslips generated for this run yet.')}
          </div>
        )}
      </div>
    </Modal>
  );
};
