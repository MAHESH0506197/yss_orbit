// yss_orbit\frontend\src\modules\observability\pages\observabilityDetailPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

export const ObservabilityDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Trace/Metric Detail: {id}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p>Deep dive into specific observability data points.</p>
      </div>
    </div>
  );
};
