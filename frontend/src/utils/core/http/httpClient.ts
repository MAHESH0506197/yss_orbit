// yss_orbit\frontend\src\core\http\httpClient.ts
// @ts-expect-error - Auto-patched TS2307
import apiClient from '../api/client';

export const httpClient = {
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  delete: apiClient.delete,
  patch: apiClient.patch,
};
