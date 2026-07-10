import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\payroll\components\payrollCard.tsx
import React from 'react';
import { PayrollRun } from '../types/payrollTypes';

export const PayrollCard: React.FC<{ run: PayrollRun }> = ({ run }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-800">{run.period}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${run.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {run.status}
        </span>
      </div>
      <div className="text-sm text-gray-600 mb-2">
        {t('auto.total_amount', 'Total Amount:')} <span className="font-bold">${run.totalAmount}</span>
      </div>
      <div className="text-xs text-gray-500">
        {t('auto.employees_processed', 'Employees Processed:')} {run.processedEmployees} / {run.totalEmployees}
      </div>
    </div>
  );
};
