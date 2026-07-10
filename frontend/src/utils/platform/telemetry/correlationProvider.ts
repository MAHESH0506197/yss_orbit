// yss_orbit\frontend\src\platform\telemetry\correlationProvider.ts
export const generateCorrelationId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getCorrelationHeaders = () => {
  return {
    'X-Correlation-ID': generateCorrelationId(),
  };
};
