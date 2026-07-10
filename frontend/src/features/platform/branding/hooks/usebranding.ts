// yss_orbit\frontend\src\modules\branding\hooks\usebranding.ts
import { useState, useEffect, useCallback } from 'react';
import { brandingApi, BrandingDto } from '../api/brandingApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const useBranding = () => {
  const [data, setData] = useState<BrandingDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await brandingApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching branding`, err);
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
