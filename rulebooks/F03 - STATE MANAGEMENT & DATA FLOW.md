<!-- yss_orbit\rulebooks\F03 - STATE MANAGEMENT & DATA FLOW.md -->
# F03 - STATE MANAGEMENT & DATA FLOW

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** F01 (Frontend Architecture), F04 (API Integration)
**Governance Role:** Frontend State Management Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Global state architecture, local vs global state boundaries, server state governance, client state governance, BusinessUnit context state, auth state handling, cache invalidation strategy, state update patterns |
| REFERENCES | F01 (frontend architecture), F04 (API integration - server state), B07 (RBAC - backend authority; frontend consumes) |
| MUST NOT DUPLICATE | Auth mechanics (B06 - backend authority), RBAC enforcement (B07 - backend authority), API contract (B12) |

---

## 1. PURPOSE

This rulebook defines **state management and data flow standards** for YSS Orbit frontend.

It establishes:
- Global vs local state governance
- Server state vs client state separation
- BusinessUnit context handling
- Auth state governance
- State update and invalidation patterns

All frontend state MUST follow these standards.

---

## 2. CRITICAL PRINCIPLE

Frontend state MUST NEVER be the authority for security decisions.

- Auth state MUST come from the backend - not locally constructed
- RBAC permissions MUST come from the backend - not locally computed
- BusinessUnit access MUST be validated by the backend - not enforced by frontend state

Frontend state is a UX optimization. The backend is the enforcement authority.

---

## 3. STATE CATEGORIES (MANDATORY)

All state MUST be explicitly categorized:

| Category | Definition | Storage |
|----------|-----------|---------|
| **Server State** | Data fetched from backend (employees, payroll, inventory) | React Query / SWR |
| **Auth State** | User identity and permissions from backend | Auth store (memory only) |
| **BusinessUnit Context** | Currently selected BusinessUnit | Context + store (memory) |
| **UI State** | Local component state (modal open, tab selection) | `useState` (component-local) |
| **Form State** | Input values and validation errors | React Hook Form (local) |
| **Global App State** | Infrequently changing cross-page state | Zustand / Redux (if needed) |

---

## 4. CORE GOVERNANCE LAWS

### 4.1 Server State Governance (MANDATORY)

- Server state (backend API data) MUST be managed using React Query (TanStack Query) or SWR
- Manual caching of server state in Redux/Zustand is PROHIBITED unless React Query is not applicable
- Server state MUST be invalidated and refetched after mutations

```typescript
// REQUIRED - React Query for server state:
const { data: employees, isLoading, error } = useQuery({
  queryKey: ['employees', businessUnitId],
  queryFn: () => employeeApi.list(businessUnitId),
  staleTime: 30_000,   // 30 seconds
});

// After mutation - invalidate server state:
const queryClient = useQueryClient();
const { mutate } = useMutation({
  mutationFn: (data) => employeeApi.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['employees', businessUnitId] });
  },
});
```

### 4.2 Auth State Governance (MANDATORY)

- Auth state MUST be stored in memory ONLY (never localStorage, sessionStorage, or cookies accessible to JavaScript)
- Auth state MUST be populated from backend API responses - never locally constructed
- Auth state MUST be cleared on logout, 401 response, and tab close (where applicable)

Auth state MUST include:
```typescript
interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  permissions: string[];               // Permission codes from backend
  allowedBusinessUnitIds: string[];    // From backend security_context
  dataScope: 'BUSINESS_UNIT' | 'GLOBAL';
  // NEW:
  availableBusinessUnits: BusinessUnitSummary[];  // all BUs user can access
  selectedBusinessUnitId: string | null;           // currently active BU
}
```

BusinessUnit selection MUST:
1. Update `selectedBusinessUnitId` in AuthState
2. Trigger full TenantContext reload for new BusinessUnit
3. Clear all module-specific query caches
4. Navigate to the default module dashboard for the new BusinessUnit

Rules:
- `permissions` MUST come from backend - NEVER computed locally
- `allowedBusinessUnitIds` MUST come from backend - NEVER constructed from client-side data

### 4.3 BusinessUnit Context Governance (MANDATORY)

The TenantContext state structure (v4.0):

```typescript
interface TenantContextState {
  businessUnit: {
    id: string;
    name: string;
    code: string;
    address: Address;
  };
  organization: {
    id: string;
    name: string;
    legalName: string;
  };
  domain: {                    // ← "sector" is RETIRED - use "domain"
    id: string;
    code: string;              // 'RETAIL' | 'PHARMACY' | 'HRMS' | 'MANUFACTURING' etc.
    name: string;
  };
  subscribedModules: string[];           // ['HRMS_CORE', 'PAYROLL', 'ATTENDANCE']
  featureFlags: Record<string, boolean>; // {'advanced_payroll': true, ...}
  settings: {
    timezone: string;
    currency: string;
    dateFormat: string;
    payrollCycle: string;
    workingDays: string[];
    [key: string]: unknown;
  };
  userPermissions: string[];
  userRole: string;
  isLoaded: boolean;
  loadError: string | null;
}
```

Rules:
- The currently selected BusinessUnit MUST be stored in a React Context AND a memory state store
- The selected BusinessUnit ID MUST be sent with every authenticated API request as a request header
- `domain` replaces `sector` in all state references - any code using `tenantContext.sector` MUST be updated to `tenantContext.domain`
- Frontend BusinessUnit selection is UX. Backend validation is enforcement.

### 4.4 Permission-Based Rendering (MANDATORY)

Frontend MAY hide UI elements based on permissions received from the backend. This is a UX optimization ONLY.

```typescript
// REQUIRED pattern - consume backend permissions:
const { permissions } = useAuthState();

const canCreateInventory = permissions.includes('INVENTORY_CREATE');

return (
  <div>
    {canCreateInventory && <Button onClick={handleCreate}>Create Item</Button>}
  </div>
);
```

Rules:
- Permission checks MUST use permission codes (e.g., `'INVENTORY_CREATE'`) - never role names
- Frontend permission-based hiding is UX only - backend MUST still enforce on every API call
- Hiding UI elements does NOT replace backend authorization enforcement

### 4.5 State Update Patterns (MANDATORY)

- State mutations MUST go through the backend API - direct local state mutation is PROHIBITED for server state
- Optimistic updates MAY be used for UX purposes, but MUST be reconciled with backend response
- Failed mutations MUST roll back optimistic updates

### 4.6 State Cleanup on Logout (MANDATORY)

On logout, ALL in-memory state MUST be cleared:

```typescript
function handleLogout() {
  // Clear auth state
  authStore.clear();
  // Clear all React Query caches
  queryClient.clear();
  // Clear BusinessUnit context
  buContext.reset();
  // Redirect to login
  router.push('/login');
}
```

Residual state after logout = data leakage risk.

### 4.7 State Isolation Between BusinessUnits (MANDATORY)

- When a user switches BusinessUnits, ALL server state MUST be cleared and refetched
- React Query MUST include `businessUnitId` in all query keys for tenant-owned data
- Displaying cached data from a previously selected BusinessUnit after switching is PROHIBITED

```typescript
// REQUIRED - businessUnitId in query key:
useQuery({
  queryKey: ['employees', businessUnitId],  // BU in key = auto-invalidate on BU switch
  queryFn: () => employeeApi.list(businessUnitId),
});
```

---

### 4.9 Feature Flag State (MANDATORY)

Feature flags MUST be loaded as part of TenantContext and available via a dedicated hook:

```typescript
function useFeatureFlags() {
  const { featureFlags } = useTenantContext();
  return {
    isEnabled: (code: string): boolean => featureFlags[code] ?? false,
  };
}

// Usage in components:
const { isEnabled } = useFeatureFlags();
const showAdvancedPayroll = isEnabled('advanced_payroll');
```

Rules:
- Feature flags MUST be fetched from the backend with TenantContext - never hardcoded
- Feature flags MUST NOT be computed on the frontend - backend resolves them (E04 §3.7)
- Feature flag state MUST be refreshed on BusinessUnit switch
- Component rendering based on feature flags MUST use `isEnabled()` - never direct boolean checks on raw featureFlags object

### 4.10 Correlation ID Debug Context (MANDATORY)

The frontend MUST extract and store the `correlation_id` from API responses for debugging:

```typescript
// In API client interceptor (see F04):
apiClient.interceptors.response.use((response) => {
  const correlationId =
    response.headers['x-correlation-id'] ||
    response.data?.meta?.correlation_id;

  if (correlationId) {
    debugContext.setLastCorrelationId(correlationId);
  }
  return response;
});

// Debug context (stored in memory, not persisted):
const debugContext = {
  lastCorrelationId: null as string | null,
  setLastCorrelationId(id: string) { this.lastCorrelationId = id; },
  getLastCorrelationId() { return this.lastCorrelationId; },
};

// Include in error reports / support modals:
const SupportModal = () => (
  <p className="text-xs text-muted">
    Reference ID: {debugContext.getLastCorrelationId()}
  </p>
);
```


## 5. SECURITY & COMPLIANCE

- Auth state in localStorage = CRITICAL violation
- Locally constructed permission checks (not from backend) = CRITICAL violation
- Stale BusinessUnit data displayed after BU switch = data leakage risk
- Frontend enforcing RBAC independently = PROHIBITED

---

## 6. NON-NEGOTIABLE RULES

- Auth tokens in localStorage/sessionStorage = CRITICAL violation
- Permissions computed locally = PROHIBITED
- Missing businessUnitId in query keys for tenant data = HIGH violation
- State not cleared on logout = HIGH violation
- State not cleared on BusinessUnit switch = HIGH violation
- Role-name-based frontend permission checks = PROHIBITED (use permission codes)
- Using 'tenantContext.sector' = PROHIBITED (use 'tenantContext.domain')
- Feature flags hardcoded in frontend = PROHIBITED
- Feature flags checked directly on raw featureFlags object = PROHIBITED

---

## 7. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 8. TESTING REQUIREMENTS

- State initialization MUST be tested
- Auth state population from backend MUST be tested
- State cleanup on logout MUST be tested
- State isolation on BusinessUnit switch MUST be tested
- Permission-based rendering MUST be tested
- Query invalidation after mutation MUST be tested
- Any failing test MUST block deployment

---

## 9. QUICK SUMMARY

- Server state → React Query with businessUnitId in keys
- Auth state → memory only, from backend
- Permissions → from backend, permission codes only
- BusinessUnit switch → clear all server state caches
- Logout → clear ALL state

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE FRONTEND ARCHITECT REVIEW.
