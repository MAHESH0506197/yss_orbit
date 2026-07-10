import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\payroll\pages\SalaryStructurePage.tsx
import React from 'react';
import { SalaryBuilder } from '@/features/payroll/components/SalaryBuilder';

export const SalaryStructurePage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">{t('auto.salary_structures', 'Salary Structures')}</h1>
      <SalaryBuilder />
    </div>
  );
};
