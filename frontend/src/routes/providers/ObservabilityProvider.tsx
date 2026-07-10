// yss_orbit\frontend\src\app\providers\ObservabilityProvider.tsx
import React, { useEffect } from 'react';

export const ObservabilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // This is where we would initialize Sentry, Datadog RUM, or OpenTelemetry
    console.info("Observability instrumentation initialized.");
  }, []);

  return <>{children}</>;
};
