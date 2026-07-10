// yss_orbit\frontend\src\core\api\client.ts
/**
 * YSS Orbit — Axios API Client
 * HttpOnly cookie auth, CSRF injection, auto-refresh on 401, correlation ID tracking.
 * Tokens NEVER in localStorage. All requests carry credentials.
 */
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import i18n from '@/utils/i18n/i18n';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const CSRF_COOKIE_NAME = 'csrftoken';
const CSRF_HEADER_NAME = 'X-CSRFToken';

// Endpoints that do NOT need X-Business-Unit-Id header
const EXEMPT_BU_PATHS = new Set([
  '/init/',
  '/auth/login/',
  '/auth/logout/',
  '/auth/token/refresh/',
  '/auth/otp/verify/',
  '/auth/otp/resend/',
  '/auth/password/forgot/',
  '/auth/password/reset/',
  '/me/',
  '/health/',
]);

// Financial endpoints that require Idempotency-Key
const IDEMPOTENCY_PATHS = [
  '/pos/',
  '/billing/',
  '/payroll/',
  '/inventory/stock-adjustments/',
];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() ?? '';
  return '';
}

function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processRefreshQueue(error: Error | null): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(null);
  });
  refreshQueue = [];
}

// ---------------------------------------------------------------------------
// Axios Instance
// ---------------------------------------------------------------------------
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // MANDATORY — HttpOnly cookies
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request Interceptors
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Normalize URL to prevent /api/v1/api/v1/ before evaluating paths
    if (config.url?.startsWith('/api/v1/')) {
      config.url = config.url.substring(7); // strip '/api/v1' so BASE_URL can prepend it cleanly
    } else if (config.url === '/api/v1') {
      config.url = '/';
    }

    // 2. CSRF token injection
    const csrfToken = getCookie(CSRF_COOKIE_NAME);
    if (csrfToken && config.headers) {
      config.headers[CSRF_HEADER_NAME] = csrfToken;
    }

    // 3. X-Business-Unit-Id header
    const path = config.url ?? '';
    const isExempt = Array.from(EXEMPT_BU_PATHS).some(p => path.startsWith(p));
    if (!isExempt) {
      const buId = useAuthStore.getState().selectedBusinessUnitId;
      if (buId && config.headers) {
        config.headers['X-Business-Unit-Id'] = buId;
      }
    }

    // 4. Idempotency-Key for financial endpoints
    const method = (config.method ?? '').toUpperCase();
    const needsIdempotency =
      ['POST', 'PUT', 'PATCH'].includes(method) &&
      IDEMPOTENCY_PATHS.some(p => path.startsWith(p));
    if (needsIdempotency && config.headers && !config.headers['Idempotency-Key']) {
      config.headers['Idempotency-Key'] = generateIdempotencyKey();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response Interceptors
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Extract correlation ID for debugging
    const correlationId = response.headers['x-correlation-id'];
    if (correlationId) {
      (window as any).__lastCorrelationId = correlationId;
    }
    return response;
  },
  async (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _disableToast?: boolean };
    const status = error.response?.status;
    const errorCode = error.response?.data?.error?.code;

    // ── 401: Token expired → refresh once ────────────────────────────────
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login/') || 
                           originalRequest.url?.includes('/auth/token/refresh/');
                           
    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/auth/token/refresh/');
        processRefreshQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processRefreshQueue(new Error('Session expired'));
        // Clear auth state and redirect to login
        useAuthStore.getState().clearAuth();
        window.location.href = `/login?return=${encodeURIComponent(window.location.pathname)}`;
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── 402: Plan limit exceeded ──────────────────────────────────────────
    if (status === 402) {
      toast.error(i18n.t('messages.plan_limit_reached', 'Plan limit reached. Please upgrade your subscription.'), {
        id: 'plan-limit',
        duration: 8000,
        icon: '⚡',
      });
    }

    // ── 403 MODULE_NOT_SUBSCRIBED ─────────────────────────────────────────
    if (status === 403 && errorCode === 'MODULE_001') {
      toast.error(i18n.t('messages.module_not_subscribed', 'This feature requires a module subscription.'), {
        id: 'module-not-subscribed',
        duration: 6000,
        icon: '🔒',
      });
    }

    // ── 503: Service unavailable (circuit open) ───────────────────────────
    if (status === 503) {
      toast.error(i18n.t('messages.service_unavailable', 'Service temporarily unavailable. Please try again.'), {
        id: 'service-unavailable',
      });
    }

    // ── Generic 5xx Server Errors ─────────────────────────────────────────
    if (status && status >= 500 && status !== 503) {
      toast.error(i18n.t('messages.server_error', 'An unexpected server error occurred.'), {
        id: 'server-error',
        duration: 5000,
      });
    }

    // ── Generic 4xx Client Errors (fallback if not handled above) ─────────
    if (status && status >= 400 && status < 500 && ![401, 402, 403].includes(status) && !originalRequest._disableToast) {
      let message = i18n.t('messages.client_error_fallback', 'An error occurred with your request.');
      const resData = error.response?.data as any;
      
      if (resData) {
        if (resData.error && resData.error.details && typeof resData.error.details.detail === 'string') {
          message = resData.error.details.detail;
        } else if (resData.error && typeof resData.error.details === 'string') {
          message = resData.error.details;
        } else if (typeof resData.detail === 'string') {
          message = resData.detail;
        } else if (resData.error && typeof resData.error.message === 'string' && resData.error.message !== 'Request failed.') {
          message = resData.error.message;
        } else if (resData.error && typeof resData.error === 'string') {
          message = resData.error;
        } else if (typeof resData === 'object') {
          const firstKey = Object.keys(resData)[0];
          if (firstKey && Array.isArray(resData[firstKey])) {
            message = `${firstKey}: ${resData[firstKey][0]}`;
          } else {
            message = JSON.stringify(resData);
          }
        }
      }

      toast.error(message, {
        id: `client-error-${status}`,
        duration: 4000,
      });
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Type-safe request helpers
// ---------------------------------------------------------------------------
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then(r => r.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then(r => r.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then(r => r.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then(r => r.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then(r => r.data),
};

export default apiClient;
