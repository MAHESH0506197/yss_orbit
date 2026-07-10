// yss_orbit\frontend\src\core\performance\performanceMonitor.ts
export class PerformanceMonitor {
  static trackRenderTime(componentName: string, startTime: number) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    if (duration > 16) {
      // 16ms is roughly 1 frame at 60fps. Warn if rendering takes longer.
      console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms (Long Render)`);
    }
  }
}
