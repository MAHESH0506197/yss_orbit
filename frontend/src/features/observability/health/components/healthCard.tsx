// yss_orbit\frontend\src\modules\health\components\healthCard.tsx
import React from 'react';
import { HealthStatus } from '../types/healthTypes';
import { ServiceStatusIndicator } from './ServiceStatusIndicator';

export const HealthCard: React.FC<{ status: HealthStatus }> = ({ status }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">System Status</h2>
        <ServiceStatusIndicator status={status.status} />
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500 block">Version</span>
          <span className="font-medium">{status.version}</span>
        </div>
        <div>
          <span className="text-gray-500 block">Uptime</span>
          <span className="font-medium">{status.uptime}</span>
        </div>
      </div>
    </div>
  );
};
