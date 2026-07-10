// yss_orbit\frontend\src\modules\audit\hooks\useaudit.ts
import { useState, useEffect, useCallback } from 'react';
import { auditApi, AuditDto } from '../api/auditApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const useAudit = (userId?: string) => {
  const [data, setData] = useState<AuditDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await auditApi.getAll(userId);
      // Ensure result is an array before setting it to data
      if (Array.isArray(result)) {
        setData(result);
      } else if (result && typeof result === 'object' && Array.isArray((result as any).results)) {
        setData((result as any).results);
      } else {
        setData([]);
      }
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching audit`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
