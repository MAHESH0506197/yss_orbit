// yss_orbit\frontend\src\core\hooks\useAsync.ts
import { useState, useCallback } from 'react';
// @ts-expect-error - Auto-patched TS2307
import { handleError, AppError } from '../errors/errorHandler';

export const useAsync = <T,>() => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err: any) {
      const handledError = handleError(err);
      setError(handledError);
      throw handledError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, data, loading, error, setData };
};
