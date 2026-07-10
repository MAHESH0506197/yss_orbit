// yss_orbit\frontend\src\modules\health\components\ServiceStatusIndicator.tsx
import React from 'react';

export const ServiceStatusIndicator: React.FC<{ status: 'OK' | 'DEGRADED' | 'DOWN' }> = ({ status }) => {
  let color = 'bg-gray-400';
  if (status === 'OK') color = 'bg-green-500';
  if (status === 'DEGRADED') color = 'bg-yellow-500';
  if (status === 'DOWN') color = 'bg-red-500';

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${color} animate-pulse`}></div>
      <span className="text-sm font-medium uppercase text-gray-700">{status}</span>
    </div>
  );
};
