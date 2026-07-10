// yss_orbit\frontend\src\modules\platformAdmin\pages\BreakGlassPage.tsx
import React from 'react';
import { BreakGlassConfirm } from './components/BreakGlassConfirm';

export const BreakGlassPage: React.FC = () => {
  const handleConfirm = (reason: string) => {
    console.warn('Break Glass Initiated:', reason);
    // Submit emergency access request via hook/service
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Emergency Access (Break Glass)</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="mb-6 text-gray-600">This action bypasses standard access controls for emergency interventions. All actions will be strictly audited.</p>
        <BreakGlassConfirm onConfirm={handleConfirm} />
      </div>
    </div>
  );
};
