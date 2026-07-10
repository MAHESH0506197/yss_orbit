// yss_orbit\frontend\src\modules\integration\hooks\useintegration.ts
import { useState, useEffect, useCallback } from 'react';
import { integrationApi, IntegrationDto } from '../api/integrationApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const useIntegration = () => {
  const [data, setData] = useState<IntegrationDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await integrationApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching integration`, err);
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
