// yss_orbit\frontend\src\modules\observability\pages\MetricsPage.tsx
import React from 'react';
import { MetricsChart } from './components/MetricsChart';

export const MetricsPage: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">System Metrics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricsChart title="API Response Time (ms)" data={[]} />
        <MetricsChart title="Error Rate (%)" data={[]} />
        <MetricsChart title="CPU Usage (%)" data={[]} />
        <MetricsChart title="Memory Usage (MB)" data={[]} />
      </div>
    </div>
  );
};
