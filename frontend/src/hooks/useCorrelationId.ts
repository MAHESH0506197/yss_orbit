// yss_orbit\frontend\src\core\hooks\useCorrelationId.ts
import { useMemo } from 'react';

// Generates a UUID v4
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
};

export const useCorrelationId = () => {
  const correlationId = useMemo(() => uuidv4(), []);
  return correlationId;
};
