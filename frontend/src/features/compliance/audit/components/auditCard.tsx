// yss_orbit\frontend\src\modules\audit\components\auditCard.tsx
import React from 'react';
import { AuditLog } from '../types/auditTypes';
import { formatIST } from '@/utils/date';

export const AuditCard: React.FC<{ log: AuditLog }> = ({ log }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{log.action}</span>
        <span className="text-xs text-gray-400">{formatIST(new Date(log.timestamp), 'PP pp')}</span>
      </div>
      <p className="text-sm font-medium text-gray-800">{log.description}</p>
      <div className="mt-2 text-xs text-gray-500">
        User ID: {log.userId} | IP: {log.ipAddress}
      </div>
    </div>
  );
};
