// yss_orbit\frontend\src\modules\observability\components\TraceViewer.tsx
import React from 'react';

export const TraceViewer: React.FC<{ trace: any }> = ({ trace }) => {
  if (!trace) return <div className="text-gray-500 text-sm">No trace selected.</div>;

  return (
    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto h-64 overflow-y-auto">
      <pre>{JSON.stringify(trace, null, 2)}</pre>
    </div>
  );
};
