import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\appraisal\pages\ReviewCyclePage.tsx
import React from 'react';

export const ReviewCyclePage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">{t('auto.review_cycles', 'Review Cycles')}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-600">{t('auto.active_review_cycle', 'Active Review Cycle:')} <strong>{t('auto.q2_2026_annual_performance', 'Q2 2026 Annual Performance')}</strong></p>
        <p className="text-sm text-gray-500 mt-2">{t('auto.deadline_june_30_2026', 'Deadline: June 30, 2026')}</p>
        
        <div className="mt-8">
          <button className="bg-blue-600 text-white px-4 py-2 rounded font-medium">{t('auto.configure_new_cycle', 'Configure New Cycle')}</button>
        </div>
      </div>
    </div>
  );
};
