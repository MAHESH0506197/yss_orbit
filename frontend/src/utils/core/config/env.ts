// yss_orbit\frontend\src\core\config\env.ts
export const getEnv = (key: string, defaultValue: string = ''): string => {
  return import.meta.env[key] || defaultValue;
};

export const ENV = {
  API_URL: getEnv('VITE_API_URL', 'http://localhost:8000/api'),
  APP_NAME: getEnv('VITE_APP_NAME', 'YSS Orbit'),
  ENVIRONMENT: getEnv('VITE_ENVIRONMENT', 'development'),
};
