// yss_orbit\frontend\src\modules\recruitment\hooks\userecruitment.ts
import { useState, useEffect, useCallback } from 'react';
import { recruitmentApi, RecruitmentDto } from '../api/recruitmentApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const useRecruitment = () => {
  const [data, setData] = useState<RecruitmentDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await recruitmentApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching recruitment`, err);
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
