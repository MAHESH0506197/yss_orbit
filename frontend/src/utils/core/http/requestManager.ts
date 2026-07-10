// yss_orbit\frontend\src\core\http\requestManager.ts
import { requestQueue } from './requestQueue';
import apiClient from '@/api/client';

export class RequestManager {
  static async makeRequest(config: any) {
    if (!navigator.onLine) {
      return new Promise((resolve, reject) => {
        requestQueue.addRequest({ config, resolve, reject });
      });
    }
    return apiClient.request(config);
  }
}
