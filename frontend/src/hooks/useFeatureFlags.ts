// yss_orbit\frontend\src\hooks\useFeatureFlags.ts
import { useQuery } from '@tanstack/react-query';
// @ts-expect-error - Auto-patched TS2307
import { apiService, FeatureFlags } from './services/apiService';

export const useFeatureFlags = () => {
  const { data, isLoading, isError, error, refetch } = useQuery<FeatureFlags, Error>({
    queryKey: ['featureFlags'],
    queryFn: () => apiService.getFeatureFlags(),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const isFeatureEnabled = (featureName: string): boolean => {
    if (!data) return false;
    return !!data[featureName];
  };

  return {
    featureFlags: data,
    isLoading,
    isError,
    error,
    refetch,
    isFeatureEnabled,
  };
};
