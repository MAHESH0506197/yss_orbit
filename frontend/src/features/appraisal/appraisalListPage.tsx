import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\appraisal\pages\appraisalListPage.tsx
import React from 'react';
import { AppraisalCard } from './components/appraisalCard';

export const AppraisalListPage: React.FC = () => {
  const { t } = useTranslation();
  const mockAppraisals = [
    { id: 1, employeeName: 'Alice Smith', period: 'Q1 2026', status: 'Completed', score: 4.5 },
    { id: 2, employeeName: 'Bob Jones', period: 'Q1 2026', status: 'In Progress', score: 3.0 },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('auto.performance_appraisals', 'Performance Appraisals')}</h1>
        <button className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md font-medium">{t('auto.new_appraisal', 'New Appraisal')}</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockAppraisals.map(app => (
          <AppraisalCard key={app.id} appraisal={app} />
        ))}
      </div>
    </div>
  );
};
