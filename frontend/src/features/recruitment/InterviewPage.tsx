import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\recruitment\pages\InterviewPage.tsx
import React from 'react';
import { InterviewScheduler } from './components/InterviewScheduler';

export const InterviewPage: React.FC = () => {
  const { t } = useTranslation();
  const handleSchedule = (data: any) => {
    console.log('Scheduled', data);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">{t('auto.schedule_interview', 'Schedule Interview')}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <InterviewScheduler onSchedule={handleSchedule} />
      </div>
    </div>
  );
};
