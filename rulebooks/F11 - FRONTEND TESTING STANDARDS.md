<!-- yss_orbit\rulebooks\F11 - FRONTEND TESTING STANDARDS.md -->
# F11 - FRONTEND TESTING STANDARDS

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** F01 (Frontend Architecture), All F-Series Rulebooks
**Governance Role:** Frontend Testing Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Frontend test types and coverage requirements, unit test standards, integration test standards, E2E test standards, mock API patterns, accessibility test standards, CI/CD test gate requirements |
| REFERENCES | All F-series rulebooks (each defines what must be tested in that domain), B21 (production readiness - tests must pass) |
| MUST NOT DUPLICATE | Specific test scenarios (defined in each domain rulebook), backend testing (B-series) |

---

## 1. PURPOSE

This rulebook defines **frontend testing standards** for YSS Orbit.

It establishes:
- Required test types and coverage
- Testing tool standards
- Mock and fixture standards
- CI/CD gate requirements

All frontend code MUST meet these testing standards before deployment.

---

## 2. TEST PYRAMID (MANDATORY)

Frontend tests MUST follow the test pyramid:

```text
         ┌─────────────────────┐
         │    E2E Tests (few)  │  ← Critical user journeys
         │   Playwright         │
         ├─────────────────────┤
         │ Integration Tests    │  ← Page + component + API interaction
         │  (moderate)          │
         │  React Testing Lib   │
         ├─────────────────────┤
         │   Unit Tests (many)  │  ← Components, hooks, utilities
         │   Vitest             │
         └─────────────────────┘
```

---

## 3. TECHNOLOGY STANDARDS

| Test Type | Tool |
|-----------|------|
| Unit & Integration | Vitest + React Testing Library |
| E2E | Playwright |
| Accessibility | axe-core (via `@axe-core/react` or Playwright) |
| Mock API | MSW (Mock Service Worker) |
| Visual Regression | Optional - Chromatic or Percy |

---

## 4. CORE GOVERNANCE LAWS

### 4.1 Unit Tests (MANDATORY)

What MUST have unit tests:
- All custom hooks
- All utility functions
- All state management logic (stores, context)
- All permission check logic
- All form validation schemas (Zod schemas)
- All API error mapping functions

```typescript
// Example - testing PermissionGate:
describe('PermissionGate', () => {
  it('renders children when user has permission', () => {
    mockAuthState({ permissions: ['inventory.stock.create'] });
    render(
      <PermissionGate permission="inventory.stock.create">
        <button>Create</button>
      </PermissionGate>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders fallback when user lacks permission', () => {
    mockAuthState({ permissions: [] });
    render(
      <PermissionGate permission="inventory.stock.create" fallback={<span>No access</span>}>
        <button>Create</button>
      </PermissionGate>
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('No access')).toBeInTheDocument();
  });

  it('requires ALL permissions when requireAll is true', () => {
    mockAuthState({ permissions: ['inventory.stock.create'] }); // missing inventory.stock.delete
    render(
      <PermissionGate permission={['inventory.stock.create', 'inventory.stock.delete']} requireAll>
        <button>Bulk Delete</button>
      </PermissionGate>
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
```

### 4.2 Integration Tests (MANDATORY)

What MUST have integration tests:
- All page-level components (render with mocked API responses)
- All form flows (submit, error handling, success)
- All authentication flows (login, logout, token refresh)
- All BusinessUnit switch flows
- All protected route behaviors (auth guard, permission guard)

Use MSW for API mocking in integration tests:

```typescript
// MSW handler example:
import { http, HttpResponse } from 'msw';

const handlers = [
  http.get('/api/v1/employees/', () => {
    return HttpResponse.json({
      success: true,
      data: [mockEmployee],
      error: null,
      meta: { pagination: { total: 1, limit: 25, offset: 0, has_next: false, has_prev: false }, trace_id: 'test-trace' },
    });
  }),

  http.post('/api/v1/employees/', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: { id: 'new-uuid', ...body },
      error: null,
      meta: { trace_id: 'test-trace' },
    }, { status: 201 });
  }),
];
```

### 4.3 E2E Tests (MANDATORY)

The following critical user journeys MUST have E2E tests:

```text
□ Login flow (valid and invalid credentials)
□ Logout flow
□ MFA flow
□ BusinessUnit selection and switch
□ Employee list and detail view
□ Employee creation (happy path + validation error)
□ Permission-based UI (authorized vs unauthorized user)
□ Session expiry and redirect
□ 404 page
□ 403 page
```

E2E tests MUST run in CI/CD before production deployment.

### 4.4 Accessibility Tests (MANDATORY)

All page-level components MUST pass axe-core accessibility checks:

```typescript
import { checkA11y } from 'axe-playwright';

test('employee list page has no accessibility violations', async ({ page }) => {
  await page.goto('/employees');
  await checkA11y(page);
});
```

### 4.5 Mock Standards (MANDATORY)

- MSW MUST be used for API mocking in integration tests
- Manual `jest.mock()` for API modules is PROHIBITED in integration tests
- Test fixtures MUST match the canonical TypeScript types (no loose `any` in fixtures)
- Test fixtures MUST represent realistic data (no placeholder names like `"test123"`)

### 4.6 Test Structure (MANDATORY)

All tests MUST follow the Arrange-Act-Assert pattern:

```typescript
describe('EmployeeCreateForm', () => {
  it('submits form and shows success message on valid input', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<EmployeeCreateForm />);

    // Act
    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.click(screen.getByRole('button', { name: 'Save Employee' }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Employee created successfully.')).toBeInTheDocument();
    });
  });
});
```

### 4.7 Coverage Requirements (MANDATORY)

| Test Type | Minimum Coverage |
|-----------|----------------|
| Unit tests | 80% branch coverage for hooks, utils, stores |
| Integration tests | All page components covered |
| E2E tests | All critical user journeys covered |
| Accessibility | Zero critical violations on all pages |

### 4.8 CI/CD Gate (MANDATORY)

ALL of the following MUST pass before production deployment:

```text
□ All unit tests pass
□ All integration tests pass
□ All E2E tests pass
□ Accessibility checks pass (zero critical violations)
□ No TypeScript errors (tsc --noEmit)
□ No ESLint errors
□ Bundle size within threshold
```

Any failing CI/CD gate = deployment BLOCKED.

### 4.9 Test Data Standards (MANDATORY)

- Test data MUST use factory functions - not hardcoded inline objects
- Factory functions MUST produce valid, typed test objects

```typescript
// src/tests/factories/employee.factory.ts
export function createMockEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'emp-uuid-001',
    name: 'Jane Smith',
    email: 'jane@example.com',
    business_unit_id: 'bu-uuid-001',
    is_active: true,
    is_deleted: false,
    ...overrides,
  };
}
```

---

### 4.12 Event-Driven Flow Testing (MANDATORY)

Frontend tests MUST cover workflows that trigger background jobs and poll for results:

```typescript
describe('PayrollRunFlow', () => {
  it('initiates payroll run and shows progress until completion', async () => {
    server.use(
      http.post('/api/v1/payroll/runs/', () =>
        HttpResponse.json({
          success: true,
          data: { job_id: 'job-123', status: 'queued' },
        })
      ),
      http.get('/api/v1/jobs/job-123/', () =>
        HttpResponse.json({
          success: true,
          data: { job_id: 'job-123', status: 'processing', progress: 45 },
        }),
        { once: true }
      ),
      http.get('/api/v1/jobs/job-123/', () =>
        HttpResponse.json({
          success: true,
          data: {
            job_id: 'job-123',
            status: 'completed',
            result_url: '/api/v1/payroll/runs/run-456/',
          },
        })
      ),
    );

    render(<PayrollPage />, { wrapper: TenantContextProvider });
    await userEvent.click(screen.getByRole('button', { name: /run payroll/i }));
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
    expect(await screen.findByText(/payroll run completed/i)).toBeInTheDocument();
  });
});
```

### 4.13 Module Subscription UI Testing (MANDATORY)

```typescript
describe('ModuleSubscriptionGuard', () => {
  it('shows ModuleNotSubscribedPage when module not in subscribedModules', () => {
    render(
      <MemoryRouter initialEntries={['/payroll/runs']}>
        <TenantContextProvider value={mockContextWithoutPayroll}>
          <AppRouter />
        </TenantContextProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/module not available/i)).toBeInTheDocument();
    expect(screen.queryByText(/payroll runs/i)).not.toBeInTheDocument();
  });

  it('redirects to dashboard on BusinessUnit switch', async () => {
    const { switchBusinessUnit } = renderWithRouter(<App />, { route: '/payroll/runs' });
    await act(() => switchBusinessUnit('new-bu-id'));
    expect(window.location.pathname).toBe('/dashboard');
  });
});
```

### 4.14 Feature Flag UI Testing (MANDATORY)

```typescript
describe('FeatureFlagRendering', () => {
  it('hides advanced payroll section when feature flag is false', () => {
    const ctx = mockTenantContext({
      featureFlags: { advanced_payroll: false, basic_payroll: true },
    });
    render(<PayrollSettings />, { wrapper: () => <TenantContextProvider value={ctx} /> });
    expect(screen.queryByText(/advanced salary components/i)).not.toBeInTheDocument();
  });

  it('shows advanced payroll section when feature flag is true', () => {
    const ctx = mockTenantContext({
      featureFlags: { advanced_payroll: true, basic_payroll: true },
    });
    render(<PayrollSettings />, { wrapper: () => <TenantContextProvider value={ctx} /> });
    expect(screen.getByText(/advanced salary components/i)).toBeInTheDocument();
  });
});
```

### 4.15 Correlation ID Display Testing (MANDATORY)

```typescript
describe('CorrelationIdDebugContext', () => {
  it('extracts and stores correlation_id from API response header', async () => {
    server.use(
      http.get('/api/v1/employees/', () =>
        HttpResponse.json(
          { success: true, data: [], error: null, meta: { correlation_id: 'corr-abc-123' } },
          { headers: { 'X-Correlation-Id': 'corr-abc-123' } }
        )
      )
    );
    render(<EmployeeList />);
    await waitFor(() =>
      expect(debugContext.getLastCorrelationId()).toBe('corr-abc-123')
    );
  });

  it('shows correlation_id in support modal', async () => {
    debugContext.setLastCorrelationId('corr-xyz-789');
    render(<SupportModal />);
    expect(screen.getByText('corr-xyz-789')).toBeInTheDocument();
  });
});
```


## 5. NON-NEGOTIABLE RULES

- Missing unit tests for hooks/utils = PROHIBITED
- Missing integration tests for pages = PROHIBITED
- Missing E2E tests for critical flows = PROHIBITED
- Missing accessibility tests = PROHIBITED
- Missing event-driven flow tests (job polling) = PROHIBITED
- Missing module subscription UI tests = PROHIBITED
- Missing feature flag rendering tests = PROHIBITED
- Missing correlation_id extraction tests = PROHIBITED
- Failing CI/CD tests deployed to production = CRITICAL violation
- Hardcoded test data without factories = MEDIUM violation
- Manual API mocks instead of MSW = PROHIBITED

---

## 6. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 7. QUICK SUMMARY

- Unit tests: Vitest for all hooks, utils, stores, schemas
- Integration tests: React Testing Library + MSW for all pages
- E2E tests: Playwright for all critical user journeys
- Accessibility: axe-core on all pages
- All tests MUST pass in CI/CD before deployment

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE FRONTEND ARCHITECT REVIEW.
