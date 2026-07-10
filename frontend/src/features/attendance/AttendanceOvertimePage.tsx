import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\attendance\pages\AttendanceOvertimePage.tsx
import React from 'react';

export const AttendanceOvertimePage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">{t('auto.overtime_requests', 'Overtime Requests')}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <button className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md font-medium mb-4">{t('auto.request_overtime', 'Request Overtime')}</button>
        <p className="text-gray-500">{t('auto.no_pending_requests', 'No pending requests.')}</p>
      </div>
    </div>
  );
};
