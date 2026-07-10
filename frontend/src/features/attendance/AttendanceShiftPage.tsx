import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\attendance\pages\AttendanceShiftPage.tsx
import React from 'react';
import { ShiftCalendar } from '@/features/attendance/components/ShiftCalendar';

export const AttendanceShiftPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">{t('auto.my_shifts', 'My Shifts')}</h1>
      <ShiftCalendar shifts={[]} />
    </div>
  );
};
