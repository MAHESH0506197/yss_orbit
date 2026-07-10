import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\payroll\pages\PayrollRunPage.tsx
import React from 'react';

export const PayrollRunPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">{t('auto.process_new_payroll', 'Process New Payroll')}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p>{t('auto.select_period_apply_adjustments_and_generate_payro', 'Select period, apply adjustments, and generate payroll.')}</p>
      </div>
    </div>
  );
};
