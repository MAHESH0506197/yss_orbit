// yss_orbit\frontend\src\modules\platformAdmin\hooks\useplatformAdmin.ts
import { useState, useEffect, useCallback } from 'react';
import { platformAdminApi, PlatformadminDto } from '../api/platformAdminApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const usePlatformAdmin = () => {
  const [data, setData] = useState<PlatformadminDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await platformAdminApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching platformAdmin`, err);
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
