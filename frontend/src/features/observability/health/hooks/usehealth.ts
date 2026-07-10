// yss_orbit\frontend\src\modules\health\hooks\usehealth.ts
import { useState, useEffect, useCallback } from 'react';
import { healthApi, HealthDto } from '../api/healthApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const useHealth = () => {
  const [data, setData] = useState<HealthDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await healthApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching health`, err);
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
