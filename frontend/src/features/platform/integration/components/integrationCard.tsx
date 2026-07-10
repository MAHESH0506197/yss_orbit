// yss_orbit\frontend\src\modules\integration\components\integrationCard.tsx
import React from 'react';
import { Integration } from '../types/integrationTypes';

export const IntegrationCard: React.FC<{ integration: Integration }> = ({ integration }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-800">{integration.name}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${integration.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {integration.status}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
      <div className="text-xs text-gray-500">
        Provider: {integration.provider}
      </div>
    </div>
  );
};
