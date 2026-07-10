// yss_orbit\frontend\src\core\performance\lazyLoad.ts
import { lazy } from 'react';

export function lazyLoad(factory: () => Promise<{ default: React.ComponentType<any> }>) {
  return lazy(() => {
    return new Promise<{ default: React.ComponentType<any> }>(resolve => {
      // Intentional delay can be added here if needed for transitions
      resolve(factory());
    });
  });
}
