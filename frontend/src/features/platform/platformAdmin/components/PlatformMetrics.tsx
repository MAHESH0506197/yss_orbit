// yss_orbit\frontend\src\modules\platformAdmin\components\PlatformMetrics.tsx
import React from 'react';
import { PlatformAdminCard } from './platformAdminCard';

export const PlatformMetrics: React.FC<{ metrics: any }> = ({ metrics }) => {
  if (!metrics) return <p>Loading metrics...</p>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <PlatformAdminCard title="Total Tenants" value={metrics.totalTenants} desc="Active organizations on platform" />
      <PlatformAdminCard title="System Health" value={metrics.healthScore + '%'} desc="Overall platform stability" />
      <PlatformAdminCard title="Active Incidents" value={metrics.activeIncidents} desc="Current open P1/P2 issues" />
    </div>
  );
};
