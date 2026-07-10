<!-- yss_orbit\rulebooks\F04 - API INTEGRATION & CLIENT STANDARDS.md -->
# F04 - API INTEGRATION & CLIENT STANDARDS

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** F01 (Frontend Architecture), F03 (State Management), B12 (API Design)
**Governance Role:** Frontend API Integration Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Frontend HTTP client configuration, request interceptors, response interceptors, error handling at the client layer, automatic token refresh flow, selected_business_unit_id header injection, trace_id extraction, timeout handling |
| REFERENCES | B12 (API response envelope - consumed here), B06 (auth cookie mechanics - backend owns), X02 (error codes - consumed here), F03 (state management) |
| MUST NOT DUPLICATE | API response envelope definition (B12/B01), auth flow mechanics (B06), error code catalogue (X02) |

---

## 1. PURPOSE

This rulebook defines **frontend API integration and HTTP client standards** for YSS Orbit.

It establishes:
- HTTP client configuration
- Request and response interceptors
- Error handling at the client layer
- Auth refresh flow
- BusinessUnit context injection

All frontend API integration MUST follow these standards.

---

## 2. CORE GOVERNANCE LAWS

### 2.1 Centralized Axios Instance (MANDATORY)

A single, centralized Axios instance MUST be used for all API calls. Multiple Axios instances with different configurations are PROHIBITED.

```typescript
// src/api/client.ts - REQUIRED:
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
  withCredentials: true,    // REQUIRED - sends HttpOnly cookies with every request
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default apiClient;
```

### 2.2 Request Interceptors (MANDATORY)

Every request MUST be intercepted to inject:
1. `X-Business-Unit-Id` header (selected BusinessUnit ID)
2. CSRF token header

```typescript
apiClient.interceptors.request.use((config) => {
  // Inject selected BusinessUnit
  const selectedBuId = getSelectedBusinessUnitId();
  if (selectedBuId) {
    config.headers['X-Business-Unit-Id'] = selectedBuId;
  }

  // Inject CSRF token
  const csrfToken = getCsrfTokenFromCookie();
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }

  return config;
});
```

### 2.3 Response Interceptors (MANDATORY)

Every response MUST be intercepted to:
1. Extract and store `trace_id` from `meta`
2. Handle 401 → trigger token refresh
3. Handle 403 → show appropriate error
4. Handle 500 → trigger error reporting

```typescript
apiClient.interceptors.response.use(
  (response) => {
    // Extract and store correlation_id for debug context (F03 §4.10)
    const correlationId =
      response.headers['x-correlation-id'] ||
      response.data?.meta?.correlation_id;
    if (correlationId) {
      debugContext.setLastCorrelationId(correlationId);
    }
    // Extract trace_id for debugging
    const traceId = response.data?.meta?.trace_id;
    if (traceId) setCurrentTraceId(traceId);
    return response;
  },
  async (error) => {
    const status = error.response?.status;

    // Extract correlation_id from error responses too
    const correlationId = error.response?.headers?.['x-correlation-id'];
    if (correlationId) {
      debugContext.setLastCorrelationId(correlationId);
    }

    if (status === 401) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        return apiClient(error.config);
      }
      redirectToLogin();
      return Promise.reject(error);
    }

    if (status === 403) {
      const errorCode = error.response?.data?.error?.code;
      if (errorCode === 'MODULE_NOT_SUBSCRIBED') {
        // Redirect to module upgrade page
        router.navigate('/platform/upgrade', {
          state: {
            moduleCode: error.response.data.error.details?.module_code,
            currentPlan: error.response.data.error.details?.current_plan,
          },
        });
        return Promise.reject(error);
      }
      showPermissionDeniedError();
    }

    // Handle plan limit exceeded
    if (status === 402) {
      const errorCode = error.response?.data?.error?.code;
      if (errorCode === 'PLAN_LIMIT_EXCEEDED') {
        toast.error(
          error.response.data.error.message ||
          'Plan limit reached. Please upgrade your subscription.'
        );
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
```

### 2.4 Token Refresh Flow (MANDATORY)

On 401 response:
1. Call `POST /api/token/refresh/` (backend handles via HttpOnly cookie)
2. If refresh succeeds → retry original request
3. If refresh fails → clear auth state, redirect to login

Rules:
- Token refresh MUST NOT be attempted more than once per original request
- Refresh calls MUST NOT cause infinite loops
- Simultaneous 401 responses MUST be deduplicated - only ONE refresh call MUST occur

```typescript
let isRefreshing = false;
let refreshQueue: Array<(value: boolean) => void> = [];

async function attemptTokenRefresh(): Promise<boolean> {
  if (isRefreshing) {
    return new Promise((resolve) => { refreshQueue.push(resolve); });
  }

  isRefreshing = true;
  try {
    await apiClient.post('/api/token/refresh/');
    refreshQueue.forEach((resolve) => resolve(true));
    return true;
  } catch {
    refreshQueue.forEach((resolve) => resolve(false));
    return false;
  } finally {
    isRefreshing = false;
    refreshQueue = [];
  }
}
```

### 2.5 API Module Structure (MANDATORY)

All API calls MUST be organized in domain-specific modules:

```typescript
// src/api/employees.ts
export const employeeApi = {
  list: (buId: string, params?: EmployeeListParams) =>
    apiClient.get<ApiResponse<Employee[]>>(`/api/v1/employees/`, { params: { ...params, bu: buId } }),

  retrieve: (id: string) =>
    apiClient.get<ApiResponse<Employee>>(`/api/v1/employees/${id}/`),

  create: (data: CreateEmployeeDTO) =>
    apiClient.post<ApiResponse<Employee>>(`/api/v1/employees/`, data),

  update: (id: string, data: UpdateEmployeeDTO) =>
    apiClient.patch<ApiResponse<Employee>>(`/api/v1/employees/${id}/`, data),

  deactivate: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/api/v1/employees/${id}/`),
};
```

Direct `axios.get(...)` calls in components or hooks are PROHIBITED. All calls MUST go through domain API modules.

### 2.6 TypeScript Response Types (MANDATORY)

All API responses MUST be typed. Untyped responses are PROHIBITED.

```typescript
// REQUIRED - typed API response wrapper:
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: ApiMeta;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

interface ApiMeta {
  pagination?: PaginationMeta;
  trace_id: string;
}
```

### 2.7 Error Handling (MANDATORY)

- API errors MUST be handled consistently using the standard error envelope (B01 §5.3)
- Network errors MUST be surfaced to users with appropriate messages
- Raw API error details MUST NOT be exposed directly to users (see F07 for error display standards)
- All API errors MUST be logged with `trace_id` for debugging

### 2.8 Request Timeout (MANDATORY)

- All API requests MUST have a timeout (default: 30 seconds)
- Infinite-hanging requests are PROHIBITED
- Timeout errors MUST be surfaced with a user-friendly message

### 2.9 CSRF Initialization (MANDATORY)

Before any authenticated request, CSRF initialization MUST occur:

```typescript
// Called on app startup, before login
async function initializeCsrf(): Promise<void> {
  await apiClient.get('/api/init/');
  // Sets CSRF cookie - subsequent POST/PATCH/DELETE requests automatically include it
}
```

### 2.10 API Versioning Compliance (MANDATORY)

- All API calls MUST use versioned endpoints (`/api/v1/...`)
- Because `apiClient` is strictly configured with the domain ONLY (e.g., `http://localhost:8000`), the frontend domain API modules MUST explicitly include the `/api/v1/` prefix in their route definitions. 
- Example: `const BASE_URL = '/api/v1/organizations';` is required. `const BASE_URL = '/organizations';` is PROHIBITED.
- Unversioned API calls are PROHIBITED
- On API version changes, frontend API modules MUST be updated

---

### 3.11 Background Job Polling Hook (MANDATORY)

Long-running operations return a job_id (B12 §3.14). The frontend MUST poll using a standardized hook:

```typescript
interface JobStatus {
  jobId: string;
  jobType: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  resultUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

function useJobPoller(jobId: string | null, options?: {
  onCompleted?: (resultUrl: string) => void;
  onFailed?: (error: { code: string; message: string }) => void;
  pollIntervalMs?: number;
}) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const { pollIntervalMs = 3000, onCompleted, onFailed } = options ?? {};

  useEffect(() => {
    if (!jobId) return;
    const poll = async () => {
      try {
        const response = await apiClient.get(`/api/v1/jobs/${jobId}/`);
        const status: JobStatus = response.data.data;
        setJobStatus(status);
        if (status.status === 'completed') {
          clearInterval(intervalRef.current);
          onCompleted?.(status.resultUrl!);
        }
        if (status.status === 'failed') {
          clearInterval(intervalRef.current);
          onFailed?.({ code: status.errorCode!, message: status.errorMessage! });
        }
      } catch (err) {
        clearInterval(intervalRef.current);
      }
    };
    poll();
    intervalRef.current = setInterval(poll, pollIntervalMs);
    return () => clearInterval(intervalRef.current);
  }, [jobId]);

  return jobStatus;
}
```

### 3.12 Module Availability Guard (MANDATORY)

Before making any module-specific API call, the frontend MUST check `subscribedModules` from TenantContext. This is a UX guard (not a security guard):

```typescript
function useModuleGuard(moduleCode: string): boolean {
  const { subscribedModules } = useTenantContext();
  return subscribedModules.includes(moduleCode);
}

// Usage:
const PayrollPage = () => {
  const hasPayroll = useModuleGuard('PAYROLL');
  if (!hasPayroll) {
    return <ModuleNotSubscribedPage moduleCode="PAYROLL" />;
  }
  return <PayrollDashboard />;
};
```


## 3. SECURITY & COMPLIANCE

- `withCredentials: true` REQUIRED for HttpOnly cookie auth
- Tokens MUST NOT be manually attached to request headers
- CSRF token REQUIRED for all state-changing requests (POST, PATCH, PUT, DELETE)
- API base URL MUST come from environment variables - no hardcoded URLs

---

## 4. NON-NEGOTIABLE RULES

- Multiple uncentralized Axios instances = PROHIBITED
- Direct `axios.get` in components = PROHIBITED
- Missing `withCredentials: true` = CRITICAL violation
- Untyped API responses = PROHIBITED
- Missing CSRF token on state-changing requests = CRITICAL violation
- Infinite refresh loops = PROHIBITED
- Hardcoded API URLs = PROHIBITED
- Missing `/api/v1/` prefix in API client module route definitions = CRITICAL violation
- MODULE_NOT_SUBSCRIBED error not handled at API client level = PROHIBITED
- Missing correlation_id extraction from API responses = PROHIBITED
- Long-running operations polled without useJobPoller hook = PROHIBITED

---

## 5. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 6. TESTING REQUIREMENTS

- API client interceptors MUST be tested
- Token refresh flow MUST be tested (including deduplication)
- CSRF injection MUST be tested
- BusinessUnit header injection MUST be tested
- Error handling (401, 403, 500) MUST be tested
- Request timeout MUST be tested
- Any failing test MUST block deployment

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE FRONTEND ARCHITECT REVIEW.
