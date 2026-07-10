// yss_orbit\frontend\src\modules\errorLog\hooks\useerrorLog.ts
import { useState, useEffect, useCallback } from 'react';
import { errorLogApi, ErrorlogDto } from '../api/errorLogApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const useErrorLog = () => {
  const [data, setData] = useState<ErrorlogDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await errorLogApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching errorLog`, err);
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
