<!-- yss_orbit\rulebooks\F08 - ROUTING, NAVIGATION & PROTECTED ROUTES.md -->
# F08 - ROUTING, NAVIGATION & PROTECTED ROUTES

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** F01 (Frontend Architecture), F03 (State Management), F05 (Auth Flows)
**Governance Role:** Frontend Routing & Navigation Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Route definition standards, protected route wrappers, route-level permission guards, deep-link handling, navigation structure, route lazy loading, BusinessUnit context in routing, unauthenticated redirect patterns |
| REFERENCES | F03 (auth state), F05 (session expiry redirect), F09 (permission-based rendering in routes), B07 (RBAC - backend authority; routing mirrors but does not replace) |
| MUST NOT DUPLICATE | RBAC enforcement (B07 - backend authority), auth mechanics (B06), permission resolution (B07) |

---

## 1. PURPOSE

This rulebook defines **routing, navigation, and protected route standards** for YSS Orbit frontend.

Frontend routing MUST mirror the backend authorization model. Route protection is a **UX safeguard only**. The backend MUST enforce authorization independently on every API call regardless of frontend routing.

---

## 2. CRITICAL PRINCIPLE

Frontend route protection MUST NOT be treated as a security control.

- It is a UX enhancement to prevent unauthorized users from reaching pages they cannot use
- The backend enforces authorization on every request
- A user who bypasses frontend route protection MUST still be blocked by the backend
- Both are REQUIRED - but for different reasons

---

## 3. CORE GOVERNANCE LAWS

### 3.1 Route Structure (MANDATORY)

All routes MUST be organized by authentication and authorization requirement:

```typescript
// src/routes/index.tsx - REQUIRED structure:

const routes = [
  // PUBLIC routes - no authentication required
  { path: '/login',           element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password',  element: <ResetPasswordPage /> },
  { path: '/verify-email',    element: <VerifyEmailPage /> },

  // AUTHENTICATED routes - require authentication
  {
    element: <AuthenticatedLayout />,    // Protected layout wrapper
    children: [
      { path: '/dashboard',     element: <DashboardPage /> },
      // RBAC-protected routes
      {
        element: <PermissionGuard permission="EMPLOYEE_VIEW" />,
        children: [
          { path: '/employees',      element: <EmployeeListPage /> },
          { path: '/employees/:id',  element: <EmployeeDetailPage /> },
        ],
      },
      {
        element: <PermissionGuard permission="PAYROLL_VIEW" />,
        children: [
          { path: '/payroll', element: <PayrollPage /> },
        ],
      },
    ],
  },
];
```

### 3.2 Authentication Route Guard (MANDATORY)

The `AuthenticatedLayout` wrapper MUST:
1. Check if the user is authenticated (from auth store - F03)
2. If NOT authenticated → redirect to `/login?return={current_path}` immediately
3. If authenticated → render children
4. If auth state is loading → show loading indicator (NOT redirect)

```typescript
const AuthenticatedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthState();
  const location = useLocation();

  if (isLoading) return <AppLoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to={`/login?return=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
};
```

### 3.3 Permission Route Guard (MANDATORY)

The `PermissionGuard` wrapper MUST:
1. Check if the user has the required permission (from auth store)
2. If NOT authorized → render a 403 page or redirect to dashboard
3. If authorized → render children

```typescript
interface PermissionGuardProps {
  permission: string;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ permission, fallback }) => {
  const { permissions } = useAuthState();

  if (!permissions.includes(permission)) {
    return fallback ?? <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
```

Rules:
- Permission guards MUST use permission CODES (e.g., `'EMPLOYEE_VIEW'`) - NEVER role names
- Permission guards are UX safeguards only - backend enforces authorization on every API call
- A user reaching a page through permission guard does NOT mean they can perform all actions - each API call is independently authorized

### 3.4 Lazy Loading (MANDATORY)

- Route-level components MUST use `React.lazy()` for code splitting
- Entire application bundled in one chunk is PROHIBITED

```typescript
const EmployeeListPage = React.lazy(() => import('@/pages/employees/EmployeeListPage'));
const PayrollPage      = React.lazy(() => import('@/pages/payroll/PayrollPage'));

// Wrap lazy routes in Suspense:
<Suspense fallback={<PageLoadingSpinner />}>
  <Outlet />
</Suspense>
```

### 3.5 Post-Login Redirect (MANDATORY)

- After successful login, the user MUST be redirected to the originally requested URL (if valid)
- If no return URL, redirect to `/dashboard`
- Return URL MUST be validated to be a relative path (prevent open redirect)

```typescript
function getReturnUrl(searchParams: URLSearchParams): string {
  const returnUrl = searchParams.get('return') ?? '/dashboard';
  // Validate - must be relative path only (prevent open redirect)
  if (!returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
    return '/dashboard';
  }
  return returnUrl;
}
```

**Violation:** Open redirect vulnerability via unvalidated return URL = CRITICAL security breach.

### 3.6 BusinessUnit Context in Routes (MANDATORY)

- When a user navigates between routes while logged in, the selected BusinessUnit MUST persist
- Route changes MUST NOT reset the BusinessUnit context
- Navigating to a route that requires a BusinessUnit context without one selected MUST prompt BusinessUnit selection

### 3.7 404 and 403 Pages (MANDATORY)

- A 404 page MUST exist for all unmatched routes
- A 403 page MUST exist for unauthorized access attempts
- 404 and 403 pages MUST display safe, user-friendly messages
- 404 and 403 pages MUST provide navigation back to a safe location

### 3.8 Navigation Menu (MANDATORY)

- Navigation menu items MUST only be visible if the user has the required permission
- Navigation rendering MUST use permission codes from auth state (F03)
- Navigation is UX visibility only - backend still enforces permissions
- Menu visibility state MUST be derived from backend-provided permissions - NEVER locally computed

### 3.9 Route Naming Convention (MANDATORY)

All routes MUST use kebab-case:

```text
/employees                ✅
/employee-details         ✅
/payroll-reports          ✅
/EmployeeList             ❌ PascalCase not allowed
/employee_details         ❌ Underscore not allowed
```

---

## 4. SECURITY & COMPLIANCE

- Open redirect vulnerability via unvalidated return URL = CRITICAL
- Frontend route protection is UX only - backend enforces on every request
- Route protection MUST mirror backend RBAC but does NOT replace it

---

## 5. NON-NEGOTIABLE RULES

- Unauthenticated access to protected routes (no guard) = CRITICAL violation
- Role-name-based route guards = PROHIBITED (use permission codes)
- Open redirect via return URL = CRITICAL violation
- Missing 404 page = PROHIBITED
- Missing 403 page = PROHIBITED
- Missing lazy loading on route components = HIGH violation

---

## 6. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 7. TESTING REQUIREMENTS

- Authentication guard (redirect when not authenticated) MUST be tested
- Permission guard (redirect when permission missing) MUST be tested
- Post-login return URL redirect MUST be tested
- Open redirect prevention MUST be tested
- Lazy loading MUST be verified
- 404 and 403 pages MUST be tested
- Any failing test MUST block deployment

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE FRONTEND ARCHITECT REVIEW.
