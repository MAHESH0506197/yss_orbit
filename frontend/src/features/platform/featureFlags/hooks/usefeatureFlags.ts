// yss_orbit\frontend\src\modules\featureFlags\hooks\usefeatureFlags.ts
import { useState, useEffect, useCallback } from 'react';
import { featureFlagsApi, FeatureflagsDto } from '../api/featureFlagsApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const useFeatureFlags = () => {
  const [data, setData] = useState<FeatureflagsDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await featureFlagsApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching featureFlags`, err);
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
