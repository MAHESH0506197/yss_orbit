// yss_orbit\frontend\src\hooks\useBranding.ts
import { useQuery } from '@tanstack/react-query';
// @ts-expect-error - Auto-patched TS2307
import { apiService, Branding } from './services/apiService';

export const useBranding = () => {
  const { data, isLoading, isError, error, refetch } = useQuery<Branding, Error>({
    queryKey: ['branding'],
    queryFn: () => apiService.getBranding(),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours, branding rarely changes
    refetchOnWindowFocus: false,
  });

  return {
    branding: data,
    isLoading,
    isError,
    error,
    refetch,
  };
};
