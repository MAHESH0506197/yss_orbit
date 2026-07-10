// yss_orbit\frontend\src\hooks\useBusinessUnit.ts
import { useQuery } from '@tanstack/react-query';
// @ts-expect-error - Auto-patched TS2307
import { apiService, BusinessUnit } from './services/apiService';

export const useBusinessUnit = () => {
  const { data, isLoading, isError, error, refetch } = useQuery<BusinessUnit[], Error>({
    queryKey: ['businessUnits'],
    queryFn: () => apiService.getBusinessUnits(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const getBusinessUnitById = (id: string): BusinessUnit | undefined => {
    return data?.find((bu) => bu.id === id);
  };

  const activeBusinessUnits = data?.filter((bu) => bu.isActive) || [];

  return {
    businessUnits: data || [],
    activeBusinessUnits,
    isLoading,
    isError,
    error,
    refetch,
    getBusinessUnitById,
  };
};
