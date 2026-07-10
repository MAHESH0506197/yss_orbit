// yss_orbit\frontend\src\modules\attendance\hooks\useattendance.ts
import { useState, useEffect, useCallback } from 'react';
import { attendanceApi, AttendanceDto } from '../api/attendanceApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const useAttendance = () => {
  const [data, setData] = useState<AttendanceDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await attendanceApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching attendance`, err);
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
