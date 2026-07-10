<!-- yss_orbit\rulebooks\F01 - FRONTEND ARCHITECTURE & PRINCIPLES.md -->
# F01 - FRONTEND ARCHITECTURE & PRINCIPLES

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01 (System Foundation), B12 (API Design)
**Governance Role:** Frontend Architecture Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Frontend component architecture, project structure standards, frontend technology standards, rendering strategy governance, module boundaries, UI responsibility limits |
| REFERENCES | B01 (canonical terms, security context - backend only), B12 (API contract - consumed by frontend), F03 (state management), F04 (API integration) |
| MUST NOT DUPLICATE | Backend security rules (backend owns all security), API contract definition (B12), RBAC mechanics (B07) |

---

## 1. PURPOSE

This rulebook defines the **frontend architecture principles** for YSS Orbit.

It establishes:
- Frontend component structure and hierarchy
- Project organization standards
- Technology selection guidelines
- Frontend responsibility boundaries

The frontend is the **user interface layer only**. The backend is the **authority for all security, authorization, and data governance**.

---

## 2. CRITICAL PRINCIPLE

The frontend MUST NEVER:
- Make security decisions
- Define or enforce RBAC rules
- Be the source of truth for authorization
- Trust locally cached authorization data without backend validation
- Store sensitive authentication tokens in browser-accessible storage
- Duplicate backend business logic

The frontend MUST ALWAYS:
- Consume backend API contracts
- Derive authorization state from backend responses
- Send every request through backend authentication and authorization
- Treat all user input as untrusted until backend-validated

**The frontend is a display layer, not a security layer.** Frontend hides buttons, routes, and UI elements based on permissions - this is UX, not security. ALL security enforcement happens in the backend (B07, E04). A user who manually navigates to `/payroll/runs/` for an unsubscribed module MUST receive a 403 from the API - the frontend route guard is a convenience, not a security gate.

---

## 3. TECHNOLOGY STANDARDS

| Component | Required Technology |
|-----------|-------------------|
| Framework | React (latest LTS) |
| Language | TypeScript (strict mode REQUIRED) |
| Styling | Tailwind CSS or CSS Modules |
| State Management | Per F03 standards |
| API Client | Axios with interceptors (per F04) |
| Form Handling | React Hook Form + Zod validation |
| Routing | React Router v6+ |
| Build Tool | Vite |
| Testing | Vitest + React Testing Library + Playwright (E2E) |

Using technologies outside this stack without Architecture Review approval is PROHIBITED.

---

### 3.7 Platform Shell Architecture (MANDATORY)

The YSS Orbit frontend MUST be implemented as a **Platform Shell** - a single React application that hosts all modules within a consistent layout, navigation, and context frame.

The shell is the outer application wrapper that:
- Manages authentication state
- Manages BusinessUnit selection
- Renders global navigation (sidebar, header, notifications)
- Loads module routes dynamically based on active BusinessUnit's subscribed modules
- Provides global context (SecurityContext, FeatureFlags, TenantSettings) to all module UIs

**Shell Structure:**
```
PlatformShell
├── AuthGuard
│   └── BusinessUnitSelector
│       └── TenantContextProvider
│           └── AppLayout
│               ├── GlobalSidebar     ← shows only subscribed modules
│               ├── GlobalHeader      ← BU name, user avatar, notifications
│               └── <Outlet />        ← module pages render here
│                   ├── /hrms/*
│                   ├── /payroll/*
│                   ├── /inventory/*
│                   └── /pos/*
```

**TenantContextProvider MUST load on BusinessUnit selection:**
```typescript
interface TenantContext {
  businessUnit: BusinessUnit;
  organization: Organization;
  domain: Domain;               // Retail / Pharmacy / HRMS
  subscribedModules: ModuleCode[];
  featureFlags: Record<string, boolean>;
  settings: TenantSettings;
  userPermissions: Permission[];
}
```

### 3.8 Module-Based Routing (MANDATORY)

Routes MUST be organized by module. Each module owns its own route tree.

```typescript
// CORRECT - module-scoped routes:
/hrms/employees/
/hrms/employees/:id/
/payroll/runs/
/inventory/items/
/pos/bills/

// PROHIBITED - flat unscoped routes:
/employees/
/payroll/
```

Module routes MUST be conditionally registered based on `subscribedModules` from TenantContext:

```typescript
const AppRouter = () => {
  const { subscribedModules } = useTenantContext();
  return (
    <Routes>
      <Route path="/" element={<PlatformShell />}>
        {subscribedModules.includes('HRMS_CORE') && (
          <Route path="hrms/*" element={<HRMSModule />} />
        )}
        {subscribedModules.includes('PAYROLL') && (
          <Route path="payroll/*" element={<PayrollModule />} />
        )}
      </Route>
    </Routes>
  );
};
```

Navigating to an unsubscribed module route MUST redirect to a "Module Not Available" page - not a 404.

### 3.9 Domain Context in Navigation (MANDATORY)

The Global Sidebar MUST display the BusinessUnit's Domain context alongside the BusinessUnit name.

Modules NOT subscribed MUST NOT appear in navigation. They MUST NOT be greyed out or shown as locked - they simply do not appear. This prevents information leakage about what modules exist on other plans.

Exception: If the Organization is on a trial, unsubscribed modules MAY be shown with an "Upgrade to access" label - only if the product explicitly supports this upsell flow.


## 4. CORE GOVERNANCE LAWS

### 4.1 Frontend Layered Architecture (MANDATORY)

Frontend code MUST be organized into clear, separated layers:

```text
Pages / Routes
    ↓
Components (UI only - no business logic)
    ↓
Hooks (data fetching, state management, side effects)
    ↓
API Client (HTTP requests - per F04)
    ↓
Backend API (source of truth)
```

Rules:
- Business logic MUST NOT live in UI components
- Data fetching MUST be in custom hooks or query libraries
- Components MUST be presentation-only where possible

### 4.2 Project Folder Structure (MANDATORY)

```text
src/
├── components/           ← Shared, reusable UI components
│   ├── common/
│   └── forms/
├── pages/                ← Route-level page components
├── hooks/                ← Custom React hooks (data, state, behavior)
├── api/                  ← API client layer (axios instance, request functions)
├── store/                ← Global state (per F03)
├── types/                ← TypeScript types and interfaces
├── utils/                ← Pure utility functions (no API calls, no state)
├── constants/            ← Application constants (no secrets)
├── routes/               ← Routing configuration and protected route wrappers
└── tests/                ← Test files mirroring src/ structure
```

### 4.3 TypeScript Strict Mode (MANDATORY)

- TypeScript strict mode MUST be enabled in `tsconfig.json`
- `any` type is PROHIBITED unless explicitly reviewed and documented
- Implicit `any` is PROHIBITED
- Type-safe API contracts MUST be maintained and kept synchronized with backend

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 4.4 Component Responsibility (MANDATORY)

- Components MUST be responsible for UI rendering only
- Components MUST NOT contain business logic
- Components MUST NOT directly call APIs - API calls belong in hooks
- Components MUST NOT make authorization decisions - consume authorization state from backend

### 4.5 Rendering Strategy (MANDATORY)

- Sensitive pages MUST use Server-Side Rendering (SSR) or Server Components where available
- Pages accessible before authentication MUST be clearly separated from authenticated pages
- Client-side rendering of sensitive data MUST ensure tokens and auth state are not exposed in HTML source

### 4.6 Module Boundaries (MANDATORY)

- Frontend modules MUST mirror backend domain modules where applicable
- Cross-module imports in the frontend MUST go through the public interface (index exports)
- Circular dependencies are PROHIBITED

### 4.7 Code Splitting (MANDATORY)

- Large routes or modules MUST use lazy loading / code splitting
- The entire application MUST NOT be bundled into a single chunk
- Bundle size MUST be monitored - alerts MUST fire if bundle exceeds defined thresholds

### 4.8 Accessibility (MANDATORY)

- All interactive UI elements MUST have ARIA labels where applicable
- Keyboard navigation MUST be supported
- WCAG 2.1 AA compliance REQUIRED for all user-facing pages
- Accessibility MUST be tested before production launch

---

## 5. SECURITY & COMPLIANCE

- Frontend MUST NOT store auth tokens in localStorage or sessionStorage
- Frontend MUST NOT make authorization decisions independently
- Frontend MUST NOT expose API keys or secrets
- Frontend MUST consume backend security contracts - never redefine them

---

## 6. NON-NEGOTIABLE RULES

- TypeScript strict mode disabled = PROHIBITED
- `any` type without explicit review = PROHIBITED
- Business logic in UI components = PROHIBITED
- Authorization decisions in frontend code = PROHIBITED
- Auth tokens in localStorage/sessionStorage = CRITICAL violation
- API calls directly in components (not in hooks) = PROHIBITED
- Circular frontend dependencies = PROHIBITED
- Unsubscribed module routes not redirecting to 'Module Not Available' page = PROHIBITED
- Module routes not conditionally registered based on subscribedModules = PROHIBITED
- Using 'sector' instead of 'domain' in TenantContext = PROHIBITED

---

## 7. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 8. TESTING REQUIREMENTS

- All components MUST have unit tests
- All pages MUST have integration tests
- E2E tests MUST cover critical user flows
- Accessibility MUST be tested
- Bundle size MUST be checked in CI/CD
- Any failing test MUST block deployment

---

## 9. QUICK SUMMARY

- Frontend = UI only - backend owns security
- TypeScript strict mode REQUIRED
- Business logic MUST NOT be in components
- Auth state MUST come from backend
- Never store tokens in browser-accessible storage

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.
