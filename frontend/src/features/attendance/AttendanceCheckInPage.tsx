import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\attendance\pages\AttendanceCheckInPage.tsx
import React, { useState, useEffect } from 'react';
import { CheckInButton } from '@/features/attendance/components/CheckInButton';
import { formatIST } from '@/utils/date';

export const AttendanceCheckInPage: React.FC = () => {
  const { t } = useTranslation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-100 shadow-inner">
      <div className="text-center mb-8">
        <h2 className="text-xl font-medium text-gray-500">{formatIST(time, 'PPP')}</h2>
        <div className="text-5xl font-mono font-bold text-gray-800 mt-4 tabular-nums">
          {formatIST(time, 'pp')}
        </div>
      </div>
      <CheckInButton />
      <p className="mt-8 text-sm text-gray-500">{t('auto.ensure_location_services_are_enabled_if_geofencing', 'Ensure location services are enabled if geofencing is required.')}</p>
    </div>
  );
};
