// yss_orbit\frontend\src\modules\appraisal\hooks\useappraisal.ts
import { useState, useEffect, useCallback } from 'react';
import { appraisalApi, AppraisalDto } from '../api/appraisalApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const useAppraisal = () => {
  const [data, setData] = useState<AppraisalDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await appraisalApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching appraisal`, err);
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
