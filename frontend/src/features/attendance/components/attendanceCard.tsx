import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\attendance\components\attendanceCard.tsx
import React from 'react';
import { AttendanceRecord } from '../types/attendanceTypes';
import { formatTime } from '../utils/attendanceHelpers';
import { formatIST } from '@/utils/date';

export const AttendanceCard: React.FC<{ record: AttendanceRecord }> = ({ record }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-800">{formatIST(new Date(record.date), 'PPP')}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {record.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          <p className="font-medium">{t('auto.check_in', 'Check In')}</p>
          
          <p>{formatTime(record.checkInTime ?? '')}</p>
        </div>
        <div>
          <p className="font-medium">{t('auto.check_out', 'Check Out')}</p>
          
          <p>{formatTime(record.checkOutTime ?? '')}</p>
        </div>
      </div>
    </div>
  );
};
