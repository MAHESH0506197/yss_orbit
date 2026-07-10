// yss_orbit\frontend\src\features\moduleRegistry\hooks\usemoduleRegistry.ts
import { useState, useEffect, useCallback } from 'react';
import { moduleRegistryApi, ModuleregistryDto } from '../api/moduleRegistryApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const useModuleRegistry = () => {
  const [data, setData] = useState<ModuleregistryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await moduleRegistryApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching moduleRegistry`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleModule = async (id: string, is_active: boolean) => {
    try {
      const updated = await moduleRegistryApi.update(id, { is_active });
      setData(prev => prev.map(m => m.id === id ? { ...m, is_active: updated.is_active } : m));
      return updated;
    } catch (err: any) {
      logger.error(`Error toggling module`, err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    data,
    loading,
    error,
    refetch: fetchAll,
    toggleModule,
  };
};
