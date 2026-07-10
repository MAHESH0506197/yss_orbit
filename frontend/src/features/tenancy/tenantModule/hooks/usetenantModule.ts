// yss_orbit\frontend\src\features\tenantModule\hooks\usetenantModule.ts
import { useState, useEffect, useCallback } from 'react';
import { tenantModuleApi, BusinessUnitModuleDto } from '../api/tenantModuleApi';
import { logger } from '@/utils/platform/telemetry/logger';
import { useAuthStore } from '@/store/authStore';

export const useTenantModule = () => {
  const [data, setData] = useState<BusinessUnitModuleDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const buId = useAuthStore((state: any) => state.selectedBusinessUnitId);

  const fetchAll = useCallback(async () => {
    if (!buId) return;
    setLoading(true);
    try {
      const result = await tenantModuleApi.getAll(buId);
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching tenantModule`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [buId]);

  const toggleModule = async (moduleCode: string, isActive: boolean) => {
    if (!buId) return;
    try {
      if (isActive) {
        await tenantModuleApi.activate(buId, moduleCode);
      } else {
        await tenantModuleApi.deactivate(buId, moduleCode);
      }
      await fetchAll();
    } catch (err: any) {
      logger.error(`Error toggling module ${moduleCode}`, err);
      throw err;
    }
  };

  useEffect(() => {
    if (buId) {
      fetchAll();
    }
  }, [buId, fetchAll]);

  return {
    data,
    loading,
    error,
    refetch: fetchAll,
    toggleModule
  };
};
