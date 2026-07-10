// yss_orbit\frontend\src\core\observability\errorReporter.ts
export class ErrorReporter {
  static captureException(error: Error, extraContext?: Record<string, any>) {
    // Integrate with Sentry or similar observability tool
    console.error('ErrorReporter Captured:', error, extraContext);
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
}
