// yss_orbit\frontend\src\modules\errorLog\components\errorLogCard.tsx
import React from 'react';
import { ErrorLogEntry } from '../types/errorLogTypes';
import { getSeverityColor } from '../utils/errorLogHelpers';
import { formatIST } from '@/utils/date';

export const ErrorLogCard: React.FC<{ error: ErrorLogEntry }> = ({ error }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-800">{error.errorCode}</h3>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(error.severity)}`}>
          {error.severity}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2 truncate">{error.message}</p>
      <div className="text-xs text-gray-400 text-right">
        {formatIST(new Date(error.timestamp), 'PP pp')}
      </div>
    </div>
  );
};
