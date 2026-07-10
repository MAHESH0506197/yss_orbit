// yss_orbit\frontend\src\modules\featureFlags\pages\featureFlagsListPage.tsx
import React, { useEffect, useState } from 'react';
import { FlagTable } from '@/features/platform/featureFlags/components/FlagTable';
import { useFeatureFlags } from '@/features/platform/featureFlags/hooks/usefeatureFlags';
import { FeatureFlag } from '@/features/platform/featureFlags/types/featureFlagsTypes';
import { Link } from 'react-router-dom';

export const FeatureFlagsListPage: React.FC = () => {
  const { data, loading } = useFeatureFlags();
  const [flags, setFlags] = useState<any[]>([]);
  useEffect(() => { setFlags(data || []) }, [data]);

  

  const handleToggle = async (id: any, enabled: boolean) => {
    try {
      console.log('toggleFlag', id, enabled);
      setFlags(flags.map(f => f.id === id ? { ...f, enabled } : f));
    } catch (e) {
      console.error('Failed to toggle flag', e);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
        <Link to="new" className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md font-medium">Create Flag</Link>
      </div>
      
      {loading ? (
        <p>Loading flags...</p>
      ) : (
        <FlagTable flags={flags} onToggle={handleToggle} />
      )}
    </div>
  );
};
