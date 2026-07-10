// yss_orbit\frontend\src\modules\featureFlags\pages\featureFlagsDetailPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

export const FeatureFlagsDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Feature Flag: {id}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p>Advanced routing and rollout rules for this feature flag.</p>
      </div>
    </div>
  );
};
