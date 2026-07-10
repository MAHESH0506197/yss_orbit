// yss_orbit\frontend\src\core\http\requestQueue.ts
import apiClient from '@/api/client';

class RequestQueue {
  private queue: any[] = [];
  private isProcessing = false;

  addRequest(request: any) {
    this.queue.push(request);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    if (!navigator.onLine) {
      // Wait for online event
      window.addEventListener('online', () => this.processQueue(), { once: true });
      return;
    }

    this.isProcessing = true;
    while (this.queue.length > 0) {
      const { config, resolve, reject } = this.queue.shift();
      try {
        const response = await apiClient.request(config);
        resolve(response);
      } catch (err) {
        reject(err);
      }
    }
    this.isProcessing = false;
  }
}

export const requestQueue = new RequestQueue();


