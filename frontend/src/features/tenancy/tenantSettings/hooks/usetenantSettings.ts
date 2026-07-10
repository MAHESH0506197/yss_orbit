// yss_orbit\frontend\src\modules\tenantSettings\hooks\usetenantSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { tenantSettingsApi, TenantsettingsDto } from '../api/tenantSettingsApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const useTenantsettings = () => {
  const [data, setData] = useState<TenantsettingsDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await tenantSettingsApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching tenantSettings`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    data,
    loading,
    error,
    refetch: fetchAll
  };
};
