import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, Download } from 'lucide-react';

export const PayslipDetailPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('auto.payslip', 'Payslip')}</h1>
          <div className="flex gap-2">
            <button className="p-2 bg-white rounded border hover:bg-gray-50">
              <Printer className="w-4 h-4" />
            </button>
            <button className="p-2 bg-[var(--primary-color)] text-white rounded hover:opacity-90">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">{t('auto.employee_details', 'Employee Details')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{t('auto.name', 'Name')}</p>
              <p className="font-medium">{t('auto.john_doe', 'John Doe')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('auto.department', 'Department')}</p>
              <p className="font-medium">{t('auto.engineering', 'Engineering')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipDetailPage;
