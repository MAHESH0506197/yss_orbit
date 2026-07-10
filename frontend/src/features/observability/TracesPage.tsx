// yss_orbit\frontend\src\modules\observability\pages\TracesPage.tsx
import React, { useState } from 'react';
import { CorrelationSearch } from './components/CorrelationSearch';
import { TraceViewer } from './components/TraceViewer';

export const TracesPage: React.FC = () => {
  const [activeTrace, setActiveTrace] = useState<any>(null);

  const handleSearch = (id: string) => {
    console.log('Searching trace', id);
    setActiveTrace({ traceId: id, spans: [{ name: 'api_request', duration: 120 }] });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Distributed Tracing</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <CorrelationSearch onSearch={handleSearch} />
      </div>
      <TraceViewer trace={activeTrace} />
    </div>
  );
};
