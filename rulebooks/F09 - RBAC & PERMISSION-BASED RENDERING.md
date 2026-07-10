<!-- yss_orbit\rulebooks\F09 - RBAC & PERMISSION-BASED RENDERING.md -->
# F09 - RBAC & PERMISSION-BASED RENDERING

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** F01, F03 (State Management), F08 (Routing), B07 (RBAC - Backend Authority)
**Governance Role:** Frontend Permission Rendering Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Permission-based UI rendering patterns, reusable permission check component, data_scope-aware UI, permission code usage standards on frontend, UI feedback for unauthorized actions |
| REFERENCES | B07 (RBAC mechanics - backend authority; frontend consumes), F03 (auth state - source of permissions), F08 (route-level permission guards) |
| MUST NOT DUPLICATE | RBAC enforcement (B07 - backend owns), permission resolution (B07), auth state mechanics (F03) |

---

## 1. PURPOSE

This rulebook defines **permission-based UI rendering standards** for YSS Orbit frontend.

The frontend renders or hides UI elements based on permissions received from the backend. This is a **UX enhancement only** - the backend enforces authorization on every single API call.

---

## 2. CRITICAL PRINCIPLE

Frontend RBAC rendering MUST:
- Use permission CODES only - NEVER role names
- Consume permissions from backend-provided auth state only
- NEVER compute or infer permissions locally
- NEVER be treated as a security control

Backend MUST:
- Enforce authorization on every API call regardless of what the frontend shows
- NEVER trust frontend permission claims

---

## 3. CORE GOVERNANCE LAWS

### 3.1 Permission Source (MANDATORY)

- Permissions MUST come from `useAuthState()` (F03)
- Permissions MUST be backend-provided - never computed on the frontend
- `permissions` array in auth state MUST contain permission codes received from the backend login/refresh response

```typescript
// REQUIRED - consume from backend-provided auth state:
const { permissions } = useAuthState();
const canCreate = permissions.includes('INVENTORY_CREATE');

// PROHIBITED - never compute locally:
const canCreate = user.role === 'MANAGER';    // Role-name check
const canCreate = user.is_admin === true;      // Flag-based bypass
```

### 3.2 Reusable Permission Component (MANDATORY)

A `<PermissionGate>` component MUST be the standard pattern for all permission-based rendering:

```typescript
interface PermissionGateProps {
  permission: string | string[];    // Single permission or list (any match = show)
  requireAll?: boolean;             // Default false (any match); true = ALL required
  fallback?: React.ReactNode;       // What to render if unauthorized (default: null)
  children: React.ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { permissions } = useAuthState();
  const required = Array.isArray(permission) ? permission : [permission];

  const hasAccess = requireAll
    ? required.every((p) => permissions.includes(p))
    : required.some((p) => permissions.includes(p));

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
```

Usage:
```typescript
// Show button only when user has permission:
<PermissionGate permission="INVENTORY_CREATE">
  <Button onClick={handleCreate}>Create Item</Button>
</PermissionGate>

// Show alternate UI when no permission:
<PermissionGate
  permission="PAYROLL_VIEW"
  fallback={<p>You do not have access to Payroll.</p>}
>
  <PayrollDashboard />
</PermissionGate>
```

### 3.3 Permission Code Usage (MANDATORY)

- Permission checks MUST use permission codes in `UPPER_SNAKE_CASE`
- Permission codes MUST be defined as constants - not inline strings

```typescript
// src/constants/permissions.ts - REQUIRED:
export const PERMISSIONS = {
  INVENTORY_VIEW:    'INVENTORY_VIEW',
  INVENTORY_CREATE:  'INVENTORY_CREATE',
  INVENTORY_UPDATE:  'INVENTORY_UPDATE',
  INVENTORY_DELETE:  'INVENTORY_DELETE',
  PAYROLL_VIEW:      'PAYROLL_VIEW',
  EMPLOYEE_VIEW:     'EMPLOYEE_VIEW',
  EMPLOYEE_CREATE:   'EMPLOYEE_CREATE',
} as const;

// Usage:
<PermissionGate permission={PERMISSIONS.INVENTORY_CREATE}>
  <CreateButton />
</PermissionGate>
```

Inline permission code strings in components without the constants file are PROHIBITED.

### 3.4 Action-Level Permission Enforcement (MANDATORY)

Permissions MUST be checked at the action level - not just at the page level.

```typescript
// REQUIRED - action-level permission check:
<PermissionGate permission={PERMISSIONS.EMPLOYEE_UPDATE}>
  <IconButton icon={<EditIcon />} onClick={() => handleEdit(employee.id)} />
</PermissionGate>

<PermissionGate permission={PERMISSIONS.EMPLOYEE_DELETE}>
  <IconButton icon={<DeleteIcon />} onClick={() => handleDelete(employee.id)} />
</PermissionGate>
```

Showing action buttons to all users and relying solely on backend rejection = poor UX (MEDIUM violation).

### 3.5 GLOBAL Scope UI Handling (MANDATORY)

- Users with `data_scope = 'GLOBAL'` MUST see a BusinessUnit selector with all allowed BusinessUnits
- Users with `data_scope = 'BUSINESS_UNIT'` MUST see only their assigned BusinessUnit(s)
- UI scope is derived from backend-provided `data_scope` in auth state

```typescript
const { dataScope, allowedBusinessUnits } = useAuthState();

return (
  <BusinessUnitSelector
    options={allowedBusinessUnits}
    showAll={dataScope === 'GLOBAL'}
  />
);
```

### 3.6 Feedback for Unauthorized Actions (MANDATORY)

- When a user attempts an unauthorized action (backend returns 403), the frontend MUST display a clear message
- 403 MUST display: `"You do not have permission to perform this action."`
- 403 MUST NOT redirect to login (that is for 401)
- Unauthorized UI elements that cannot be hidden MUST be visually disabled with tooltip explanation

### 3.7 Permission Cache Synchronization (MANDATORY)

- When the backend invalidates permissions (role change, membership change), the frontend auth state MUST be refreshed
- Stale frontend permissions serving as UX gate after backend revocation = data exposure risk
- On role or permission changes, the frontend MUST re-fetch auth state from the backend

---

## 4. SECURITY & COMPLIANCE

- Frontend permission rendering is UX only - never security
- Backend MUST enforce authorization on every API call
- Role-name checks in frontend = PROHIBITED

---

## 5. NON-NEGOTIABLE RULES

- Role-name-based UI rendering = PROHIBITED
- Locally computed permissions = PROHIBITED
- Inline permission strings without constants = PROHIBITED (MEDIUM)
- Showing unauthorized actions without fallback = MEDIUM violation
- Missing `<PermissionGate>` on sensitive action buttons = HIGH violation
- Stale permissions not refreshed after role change = HIGH violation

---

## 6. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 7. TESTING REQUIREMENTS

- `<PermissionGate>` MUST be tested (show/hide for authorized and unauthorized users)
- Permission constants MUST be tested for completeness vs backend
- GLOBAL vs BUSINESS_UNIT scope UI MUST be tested
- 403 feedback display MUST be tested
- Permission refresh on role change MUST be tested
- Any failing test MUST block deployment

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE FRONTEND ARCHITECT REVIEW.
