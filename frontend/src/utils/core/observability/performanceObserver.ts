// yss_orbit\frontend\src\core\observability\performanceObserver.ts
export class PerformanceObserverManager {
  private static observer: PerformanceObserver | null = null;

  static init() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Send LCP, FID, CLS to tracking backend
          if (entry.entryType === 'largest-contentful-paint') {
            console.debug('LCP:', entry.startTime);
          }
        }
      });
      this.observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observer.observe({ type: 'layout-shift', buffered: true });
    }
  }

  static disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
