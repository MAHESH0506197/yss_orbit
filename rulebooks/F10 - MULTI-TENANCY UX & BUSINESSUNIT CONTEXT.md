<!-- yss_orbit\rulebooks\F10 - MULTI-TENANCY UX & BUSINESSUNIT CONTEXT.md -->
# F10 - MULTI-TENANCY UX & BUSINESSUNIT CONTEXT

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** F01, F03 (State Management), F04 (API Integration), B02 (Multi-Tenant - Backend Authority)
**Governance Role:** Frontend Multi-Tenancy UX Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | BusinessUnit selector UX, BusinessUnit context persistence, BU switch flow, BU-scoped data isolation in frontend, BU header injection, BU-aware cache invalidation in frontend, multi-BU user experience |
| REFERENCES | B02 (multi-tenant architecture - backend authority), F03 (BusinessUnit state management), F04 (header injection), F09 (permission-based rendering) |
| MUST NOT DUPLICATE | Backend tenant enforcement (B02), cache isolation (B02/B13), tenant scope enforcement (B02) |

---

## 1. PURPOSE

This rulebook defines **multi-tenancy UX and BusinessUnit context standards** for YSS Orbit frontend.

Backend (B02) owns ALL tenant enforcement. This rulebook governs the **user experience** of BusinessUnit context selection, switching, and display.

---

## 2. CRITICAL PRINCIPLE

Frontend BusinessUnit selection is UX ONLY.

- The backend validates EVERY request against `allowed_business_unit_ids`
- The frontend sending a `X-Business-Unit-Id` header does NOT grant access
- Backend validation always wins - frontend is convenience, not enforcement

---

## 3. CORE GOVERNANCE LAWS

### 3.1 BusinessUnit Selector (MANDATORY)

- Every authenticated user MUST see a BusinessUnit selector if they have access to more than one BusinessUnit
- The selector MUST display only BusinessUnits the user is authorized to access (from backend-provided `allowedBusinessUnits`)
- The selector MUST NOT display BusinessUnits the backend has not authorized

```typescript
const BusinessUnitSelector: React.FC = () => {
  const { allowedBusinessUnits, selectedBusinessUnitId, selectBusinessUnit } = useBusinessUnitContext();

  if (allowedBusinessUnits.length === 1) {
    // Auto-select if only one option - no selector needed
    return <span>{allowedBusinessUnits[0].name}</span>;
  }

  return (
    <Select
      value={selectedBusinessUnitId ?? ''}
      onChange={(id) => selectBusinessUnit(id)}
      options={allowedBusinessUnits.map((bu) => ({ value: bu.id, label: bu.name }))}
      placeholder="Select Business Unit"
    />
  );
};
```

### 3.2 BusinessUnit Context Header (MANDATORY)

- The selected `business_unit_id` MUST be sent on every authenticated API request via the `X-Business-Unit-Id` header
- Header injection is handled by the Axios request interceptor (F04)
- Requests without a selected BusinessUnit on BusinessUnit-scoped endpoints MUST be rejected

### 3.3 BusinessUnit Switch Flow (MANDATORY)

When a user switches BusinessUnits, the following MUST occur in sequence:

```typescript
async function handleBusinessUnitSwitch(newBuId: string) {
  // 1. Validate the new BU is in the allowed list
  if (!allowedBusinessUnitIds.includes(newBuId)) {
    showErrorToast('You are not authorized to access this Business Unit.');
    return;
  }

  // 2. Clear ALL tenant-scoped server state (React Query cache)
  queryClient.clear();

  // 3. Update selected BusinessUnit in context and store
  selectBusinessUnit(newBuId);

  // 4. Navigate to dashboard (or stay on page - data will refetch)
  router.push('/dashboard');
}
```

Rules:
- ALL React Query caches MUST be cleared on BusinessUnit switch (prevents cross-tenant data display)
- BusinessUnit switch MUST be validated against `allowedBusinessUnits` before applying
- Displaying data from a previously selected BusinessUnit after switching is PROHIBITED

### 3.4 Auto-Select Single BusinessUnit (MANDATORY)

- If a user has access to exactly ONE BusinessUnit, it MUST be automatically selected on login
- The BusinessUnit selector MUST NOT be displayed for single-BU users
- Single-BU users MUST still have the `X-Business-Unit-Id` header sent on every request

### 3.5 BusinessUnit Display Across the UI (MANDATORY)

- The currently selected BusinessUnit name MUST be clearly visible in the main navigation/header at all times
- Users MUST always know which BusinessUnit context they are operating in
- No data MUST be displayed without a visible BusinessUnit context indicator

```typescript
// Header display - REQUIRED:
<Header>
  <BusinessUnitBadge name={selectedBusinessUnit?.name} />
  <BusinessUnitSelector />
</Header>
```

### 3.6 Cross-BusinessUnit Navigation Prevention (MANDATORY)

- Deep links (e.g., `/employees/some-id`) MUST validate that the resource belongs to the currently selected BusinessUnit after loading
- If a resource belongs to a different BusinessUnit, the frontend MUST redirect to a safe error page
- The backend will enforce this - but the frontend MUST handle the resulting 403 gracefully

### 3.7 BU-Aware Query Keys (MANDATORY)

All React Query query keys for tenant-owned data MUST include `businessUnitId`:

```typescript
// REQUIRED:
useQuery({
  queryKey: ['employees', businessUnitId],
  queryFn: () => employeeApi.list(businessUnitId),
});

useQuery({
  queryKey: ['payroll', businessUnitId, period],
  queryFn: () => payrollApi.list(businessUnitId, period),
});

// PROHIBITED:
useQuery({
  queryKey: ['employees'],   // No BU scope - cache shared across BUs
  queryFn: () => employeeApi.list(businessUnitId),
});
```

### 3.8 BusinessUnit Persistence (MANDATORY)

- Selected BusinessUnit MUST persist across page navigation within a session
- Selected BusinessUnit MUST NOT persist across browser sessions (stored in memory - not localStorage)
- On browser refresh, the user MUST re-select their BusinessUnit (or auto-select if only one)

### 3.9 Organization Context Display (MANDATORY)

- If the platform UI shows organization-level information, it MUST be clearly labeled as "Organization" - not "Business Unit"
- Organization and BusinessUnit are DISTINCT concepts (B01 §3) and MUST be visually distinct in the UI

---

## 4. SECURITY & COMPLIANCE

- Frontend BU selection is UX only - backend validates every request
- Displaying data from the wrong BusinessUnit = data leakage risk
- Missing BU header injection = backend will reject requests

---

### 3.8 Module Not Subscribed Page (MANDATORY)

When a user navigates to a module URL that is not subscribed, they MUST see a specific page:

```typescript
const ModuleNotSubscribedPage = ({ moduleCode }: { moduleCode: string }) => (
  <div className="module-not-subscribed">
    <h2>Module Not Available</h2>
    <p>
      Your current subscription does not include {MODULE_DISPLAY_NAMES[moduleCode]}.
      Contact your administrator to upgrade your plan.
    </p>
    <Button variant="secondary" onClick={() => router.navigate('/')}>
      Go to Dashboard
    </Button>
  </div>
);
```

Rules:
- This page MUST NOT reveal plan pricing unless the org is in a self-serve upsell flow
- This page MUST NOT expose which plan would unlock the module unless product supports upsell
- The page MUST log a frontend event for analytics (module access attempted but not subscribed)

### 3.9 BusinessUnit Switch Behavior (MANDATORY)

When user switches BusinessUnit:

```typescript
const switchBusinessUnit = async (newBuId: string) => {
  // 1. Update selected BU in auth state
  setSelectedBusinessUnitId(newBuId);

  // 2. Clear all module-specific query caches
  queryClient.clear();

  // 3. Reload TenantContext for new BU (modules, features, settings, permissions)
  await loadTenantContext(newBuId);

  // 4. Navigate to dashboard (not previous module - may not be subscribed in new BU)
  router.navigate('/dashboard');

  // 5. Clear debug correlation_id context
  debugContext.setLastCorrelationId(null);
};
```

The previous module route MUST NOT be preserved after a BU switch - the module may not be subscribed in the new BusinessUnit.


## 5. NON-NEGOTIABLE RULES

- Missing `X-Business-Unit-Id` header injection = CRITICAL violation
- React Query cache not cleared on BU switch = CRITICAL tenant leak risk
- Missing BU validation on BU switch = CRITICAL violation
- BU context not visible in UI = PROHIBITED
- BU in localStorage (session persistence) = PROHIBITED
- Missing businessUnitId in query keys for tenant data = HIGH violation
- Organization and BusinessUnit terminology confusion in UI = PROHIBITED

---

## 6. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 7. TESTING REQUIREMENTS

- BU selector renders only authorized BUs MUST be tested
- BU switch clears all caches MUST be tested
- BU header injection MUST be tested on every API call
- Auto-select for single-BU user MUST be tested
- BU-aware query keys MUST be verified (no BU-missing keys for tenant data)
- Cross-BU navigation 403 graceful handling MUST be tested
- Any failing test MUST block deployment

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE FRONTEND ARCHITECT REVIEW.
