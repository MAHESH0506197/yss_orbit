// yss_orbit\frontend\src\modules\integration\pages\integrationListPage.tsx
import React, { useEffect, useState } from 'react';
import { IntegrationCard } from './components/integrationCard';
import { useIntegration } from './hooks/useintegration';
import { Integration } from './types/integrationTypes';

export const IntegrationListPage: React.FC = () => {
  const { data, loading } = useIntegration();
  const integrations = (data || []) as any;

  

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Integrations</h1>
      
      {loading ? (
        <p>Loading integrations...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration: any) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      )}
    </div>
  );
};
