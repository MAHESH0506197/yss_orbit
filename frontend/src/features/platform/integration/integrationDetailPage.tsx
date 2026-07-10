// yss_orbit\frontend\src\modules\integration\pages\integrationDetailPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

export const IntegrationDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Integration Configuration: {id}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p>Configure API keys, webhooks, and endpoints for this integration.</p>
      </div>
    </div>
  );
};
