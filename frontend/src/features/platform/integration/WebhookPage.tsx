// yss_orbit\frontend\src\modules\integration\pages\WebhookPage.tsx
import React from 'react';
import { WebhookLog } from './components/WebhookLog';

export const WebhookPage: React.FC = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Webhook Management</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-bold mb-4">Endpoints</h2>
        <p className="text-sm text-gray-600">Register new webhook endpoints here.</p>
      </div>
      <h2 className="text-lg font-bold mb-4">Recent Payload Delivery Logs</h2>
      <WebhookLog logs={[]} />
    </div>
  );
};
