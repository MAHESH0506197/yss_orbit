// yss_orbit\frontend\src\env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_AUTH_DOMAIN: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_ENVIRONMENT: 'development' | 'staging' | 'production';
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
