import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\payroll\pages\PayrollExportPage.tsx
import React from 'react';

export const PayrollExportPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">{t('auto.export_payroll_data', 'Export Payroll Data')}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p>{t('auto.export_payroll_journals_to_accounting_systems_or_t', 'Export payroll journals to accounting systems or tax authorities.')}</p>
        <div className="mt-4 space-x-4">
          <button className="bg-[var(--primary-color)] text-white px-4 py-2 rounded">{t('auto.export_to_csv', 'Export to CSV')}</button>
          <button className="bg-green-600 text-white px-4 py-2 rounded">{t('auto.export_to_quickbooks', 'Export to QuickBooks')}</button>
        </div>
      </div>
    </div>
  );
};
