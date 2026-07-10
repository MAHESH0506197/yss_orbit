// yss_orbit\frontend\src\modules\notification\hooks\usenotification.ts
import { useState, useEffect, useCallback } from 'react';
import { notificationApi, NotificationDto } from '../api/notificationApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const useNotification = () => {
  const [data, setData] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching notification`, err);
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
