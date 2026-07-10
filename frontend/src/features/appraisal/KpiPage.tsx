import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\appraisal\pages\KpiPage.tsx
import React from 'react';
import { KpiTracker } from './components/KpiTracker';

export const KpiPage: React.FC = () => {
  const { t } = useTranslation();
  const mockKpis = [
    { title: 'Sales Target Q2', progress: 75 },
    { title: 'Customer Satisfaction Score', progress: 90 },
    { title: 'Project Delivery Timeline', progress: 40 },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">{t('auto.key_performance_indicators', 'Key Performance Indicators')}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <KpiTracker kpis={mockKpis} />
      </div>
    </div>
  );
};
