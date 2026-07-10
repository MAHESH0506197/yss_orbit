// yss_orbit\frontend\src\modules\featureFlags\components\featureFlagsCard.tsx
import React from 'react';
import { FeatureFlag } from '../types/featureFlagsTypes';
import { FlagToggleSwitch } from './FlagToggleSwitch';

export const FeatureFlagsCard: React.FC<{ flag: FeatureFlag, onToggle: (id: any, enabled: boolean) => void }> = ({ flag, onToggle }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
      <div>
        <h3 className="font-bold text-gray-800">{flag.name}</h3>
        <p className="text-sm text-gray-500 font-mono">{flag.key}</p>
        <p className="text-sm text-gray-600 mt-2">{flag.description}</p>
      </div>
      <div>
        
        <FlagToggleSwitch enabled={flag.isEnabled} onChange={(enabled) => onToggle(flag.id, enabled)} />
      </div>
    </div>
  );
};
