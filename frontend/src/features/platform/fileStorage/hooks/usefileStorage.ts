// yss_orbit\frontend\src\modules\fileStorage\hooks\usefileStorage.ts
import { useState, useEffect, useCallback } from 'react';
import { fileStorageApi, FilestorageDto } from '../api/fileStorageApi';
import { logger } from '@/utils/platform/telemetry/logger';

export const useFileStorage = () => {
  const [data, setData] = useState<FilestorageDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fileStorageApi.getAll();
      setData(result);
      setError(null);
    } catch (err: any) {
      logger.error(`Error fetching fileStorage`, err);
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
    refetch: fetchAll,
    uploadFile: async (...args: any[]) => {},
    uploading: false
  };
};
export const uploadFile = async () => {}; export const uploading = false; 
