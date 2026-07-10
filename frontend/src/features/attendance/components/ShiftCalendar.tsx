import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\attendance\components\ShiftCalendar.tsx
import React from 'react';

export const ShiftCalendar: React.FC<{ shifts: any[] }> = ({ shifts }) => {
  const { t } = useTranslation();
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-medium text-gray-700">
        {t('auto.weekly_shifts', 'Weekly Shifts')}
      </div>
      <div className="p-4 grid grid-cols-7 gap-2 text-center text-sm">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="font-semibold text-gray-500 pb-2">{day}</div>
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className={`p-2 rounded ${i > 0 && i < 6 ? 'bg-blue-50 text-blue-800 border border-blue-100' : 'text-gray-400'}`}>
            {i > 0 && i < 6 ? '9:00 - 17:00' : 'Off'}
          </div>
        ))}
      </div>
    </div>
  );
};
