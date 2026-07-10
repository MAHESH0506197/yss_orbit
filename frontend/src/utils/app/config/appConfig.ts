// yss_orbit\frontend\src\app\config\appConfig.ts
export const appConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  authDomain: import.meta.env.VITE_AUTH_DOMAIN || '',
  appName: import.meta.env.VITE_APP_NAME || 'YSS Orbit',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  
  // Feature flags
  features: {
    enableDarkMode: true,
    enableMultiTenant: true,
  },
  
  // UI Config
  ui: {
    sidebarWidth: 280,
    headerHeight: 64,
  }
};
