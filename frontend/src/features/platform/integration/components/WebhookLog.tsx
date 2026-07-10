// yss_orbit\frontend\src\modules\integration\components\WebhookLog.tsx
import React from 'react';

export const WebhookLog: React.FC<{ logs: any[] }> = ({ logs }) => {
  return (
    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
      {logs.length === 0 ? (
        <p className="text-gray-500">No webhook logs available.</p>
      ) : (
        logs.map((log, i) => (
          <div key={i} className="mb-2 border-b border-gray-700 pb-2">
            <span className="text-blue-400">[{log.timestamp}]</span> {log.event} - Status: {log.statusCode}
          </div>
        ))
      )}
    </div>
  );
};
