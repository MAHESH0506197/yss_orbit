// yss_orbit\frontend\src\modules\observability\hooks\useobservability.ts
import { useState, useEffect, useCallback } from 'react';
import { observabilityApi, ObservabilityDto } from '../api/observabilityApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const useObservability = () => {
  const [data, setData] = useState<ObservabilityDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await observabilityApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching observability`, err);
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
