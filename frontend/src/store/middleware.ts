// yss_orbit\frontend\src\core\store\middleware.ts
import { StateCreator } from 'zustand';

export const loggerMiddleware = <T>(config: StateCreator<T>): StateCreator<T> => (set, get, api) => config(
  (args) => {
    if (import.meta.env.DEV) {
      console.log('  applying', args);
    }
    set(args);
    if (import.meta.env.DEV) {
      console.log('  new state', get());
    }
  },
  get,
  api
);
