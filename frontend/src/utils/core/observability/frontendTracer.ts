// yss_orbit\frontend\src\core\observability\frontendTracer.ts
// @ts-expect-error - Auto-patched TS2307
import { useCorrelationId } from '../hooks/useCorrelationId';

export class FrontendTracer {
  static startSpan(operationName: string) {
    const startTime = performance.now();
    return {
      finish: () => {
        const duration = performance.now() - startTime;
        console.debug(`[Trace] ${operationName} took ${duration.toFixed(2)}ms`);
      }
    };
  }
}
