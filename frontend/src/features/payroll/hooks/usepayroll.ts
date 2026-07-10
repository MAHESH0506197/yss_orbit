// yss_orbit\frontend\src\modules\payroll\hooks\usepayroll.ts
import { useState, useEffect, useCallback } from 'react';
import { payrollApi, PayrollDto } from '../api/payrollApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const usePayroll = () => {
  const [data, setData] = useState<PayrollDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await payrollApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching payroll`, err);
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
