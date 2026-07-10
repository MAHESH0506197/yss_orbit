// yss_orbit\frontend\src\modules\dashboard\hooks\usedashboard.ts
import { useState, useEffect, useCallback } from 'react';
import { dashboardApi, DashboardDto } from '../api/dashboardApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const useDashboard = () => {
  const [data, setData] = useState<DashboardDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await dashboardApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching dashboard`, err);
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
