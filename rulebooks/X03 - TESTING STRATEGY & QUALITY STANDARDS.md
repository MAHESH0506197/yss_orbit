<!-- yss_orbit\rulebooks\X03 - TESTING STRATEGY & QUALITY STANDARDS.md -->
# X03 - TESTING STRATEGY & QUALITY STANDARDS

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Applies To:** ALL systems - backend and frontend
**Governance Role:** Cross-System Testing Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Cross-system testing strategy, CI/CD test gate requirements, test coverage standards, security test requirements, tenant isolation test requirements, RBAC test requirements, contract test requirements, performance test requirements |
| REFERENCES | B21 (production readiness checklist), F11 (frontend-specific testing), B-series rulebooks (each defines domain-specific test scenarios) |
| MUST NOT DUPLICATE | Backend-specific test scenarios (B-series), frontend-specific test patterns (F11) |

---

## 1. PURPOSE

This rulebook defines the **cross-system testing strategy and quality standards** for YSS Orbit.

It establishes:
- Testing requirements across all layers
- Mandatory CI/CD test gates
- Security and tenant isolation test requirements
- Test quality standards

ALL code changes MUST pass these standards before deployment.

---

## 2. SCOPE

Applies to: all backend code, all frontend code, all database changes, all deployment pipelines. No change is exempt.

---

## 3. TEST PYRAMID (MANDATORY)

```text
         ┌────────────────────────────────────┐
         │     E2E / System Tests (few)        │ Playwright / Selenium
         │     Critical user journeys only     │
         ├────────────────────────────────────┤
         │   Integration Tests (moderate)      │ Django TestCase, DRF APIClient,
         │   API endpoints, service-repo flow  │ React Testing Library + MSW
         ├────────────────────────────────────┤
         │     Unit Tests (many)               │ pytest, Vitest
         │     Services, repos, utils, hooks   │
         └────────────────────────────────────┘
```

---

## 4. CORE GOVERNANCE LAWS

### 4.1 Mandatory Backend Test Coverage (MANDATORY)

| Layer | What Must Be Tested |
|-------|-------------------|
| Service Layer | All business logic, business rules, state transitions, tenant validation, RBAC validation, exception paths |
| Repository Layer | Tenant filtering on all queries, object-level scope (BU + is_deleted), bulk operations, query parameterization |
| API/View Layer | Request validation (valid and invalid), auth enforcement (401 on missing auth), RBAC enforcement (403 on missing permission), response envelope structure, pagination limits |
| Audit Logging | old_values and new_values captured correctly, audit write failure does NOT crash operation |
| Background Tasks | Idempotency, tenant context preservation, retry behavior, dead-letter handling |

### 4.2 Mandatory Security Tests (MANDATORY)

ALL of the following MUST be tested:

```text
□ Authentication bypass (unauthenticated request returns 401)
□ Authorization bypass (authenticated but wrong permission returns 403)
□ Cross-tenant data access (user A cannot access user B's BusinessUnit data)
□ Object-level tenant scope (fetch by ID without BU returns 403 or 404)
□ GLOBAL scope access (RBAC still enforced, only tenant restriction expanded)
□ Privilege escalation prevention (user cannot self-elevate permissions)
□ SQL injection prevention (parameterized queries - invalid input rejected)
□ Rate limiting enforcement (429 returned after threshold)
□ Timing attack resistance (403 response time consistent regardless of resource existence)
□ Cache leakage prevention (tenant A cannot see tenant B's cached data)
□ Background job tenant isolation (job for BU-A cannot access BU-B data)
□ Signed URL tenant validation (URL for BU-A cannot be used by BU-B user)
```

Any failing security test = DEPLOYMENT BLOCKED.

### 4.3 Mandatory Tenant Isolation Tests (MANDATORY)

```text
□ User cannot list another tenant's resources
□ User cannot retrieve another tenant's resource by ID
□ User cannot create a resource assigned to another tenant
□ User cannot update another tenant's resource
□ User cannot delete another tenant's resource
□ Soft-deleted records are excluded from all user-facing queries
□ Pagination does not leak cross-tenant records
□ Cache keys are tenant-scoped (verify cache miss on BU switch)
□ Background jobs enforce tenant scope on all DB operations
□ Cross-tenant foreign key creation is rejected
□ Organization consistency enforced (BU cannot belong to two Organizations)
```

### 4.4 Mandatory RBAC Tests (MANDATORY)

```text
□ Permission check on every protected endpoint (missing permission → 403)
□ Deny-by-default: endpoint without permission check is unreachable
□ User override: granted permission works, revoked permission blocks
□ Permission cache invalidation after role change
□ GLOBAL scope requires RBAC permission (not a bypass)
□ Menu items without permission_code = blocked by SQL validation
□ SoD violation detection at role assignment
```

### 4.5 API Contract Tests (MANDATORY)

```text
□ All responses follow { success, data, error, meta } envelope
□ All error responses include trace_id in meta
□ Validation errors include field-level details
□ Pagination returns correct meta.pagination object
□ Breaking API changes detected (contract regression tests)
□ Deprecated endpoints emit deprecation indicator
```

### 4.6 Database / Migration Tests (MANDATORY)

```text
□ All migrations are reversible (tested in staging)
□ Zero-downtime migration pattern verified (three-step NOT NULL)
□ Unique constraints on tenant-owned fields include business_unit_id
□ Audit log records cannot be updated or deleted (DB constraint test)
□ Tenant column is NOT NULL on all tenant-owned tables
□ No orphan records after tenant isolation is applied
```

### 4.7 Performance Tests (MANDATORY)

```text
□ P95 response time under acceptable threshold per B19 §3.7
□ No N+1 queries in list endpoints (EXPLAIN ANALYZE validation)
□ Cache hit/miss behavior validated
□ Long-running operations moved to background (not blocking API)
□ Pagination limits enforced (> MAX_PAGE_SIZE rejected)
```

### 4.8 CI/CD Test Gate Requirements (MANDATORY)

All the following MUST pass before any deployment:

```text
□ All unit tests pass
□ All integration tests pass
□ All security tests pass
□ All tenant isolation tests pass
□ All RBAC tests pass
□ All API contract tests pass
□ All migration tests pass
□ Code coverage meets minimum thresholds
□ No linting errors
□ TypeScript: no compilation errors (tsc --noEmit)
□ Python: black formatting check passes
□ Security scan: no critical vulnerabilities
□ Secret scan: no secrets in code
```

Any failing gate = deployment BLOCKED.

### 4.9 Test Data Standards (MANDATORY)

- Tests MUST use factory functions for test data - not hardcoded inline objects
- Test data MUST be isolated per test (no shared mutable state between tests)
- Tests MUST clean up database state after execution
- Production data MUST NOT be used in tests

### 4.10 Test Coverage Minimums (MANDATORY)

| Layer | Minimum Coverage |
|-------|----------------|
| Service Layer | 90% line coverage, 85% branch coverage |
| Repository Layer | 85% line coverage |
| API/View Layer | 90% endpoint coverage (all endpoints have at least one happy-path + one error-path test) |
| Frontend Hooks | 80% branch coverage |
| Frontend Components | All critical UI states tested (loading, error, empty, populated) |

### 4.11 Test Naming Standards (MANDATORY)

Test names MUST describe: the scenario being tested AND the expected result.

```python
# REQUIRED naming:
def test_employee_list_returns_only_current_bu_employees():
def test_employee_create_returns_403_when_permission_missing():
def test_employee_fetch_by_id_returns_404_for_other_bu_employee():

# PROHIBITED:
def test_employee():
def test_create():
def test_1():
```

### 4.12 Event-Driven Architecture Testing (MANDATORY)

**4.12.1 Domain Event Publication Tests**

Every Service Layer method that publishes a domain event MUST have a test that:
1. Verifies the event appears in event_outbox after the operation
2. Verifies the event payload contains required fields (event_type, event_version, business_unit_id, correlation_id)
3. Verifies the event was written in the same transaction as the business operation
4. Verifies NO event is written if the operation fails (transactional consistency)

**4.12.2 Event Consumer Idempotency Tests**

Every event consumer MUST have:
- A test verifying the consumer processes the event exactly once
- A test verifying duplicate event delivery does not cause duplicate side effects
- A test verifying the consumer enforces tenant isolation independently

### 4.13 Orchestrator Testing (MANDATORY)

Every Orchestrator MUST have test coverage for ALL of:
- Happy path: all steps complete; domain event published; state = completed
- Each step failure individually: compensation runs; state = failed
- Idempotency: running the same step twice does not duplicate the outcome
- Tenant isolation: orchestrator for business_unit_A cannot touch business_unit_B data

```python
class TestPayrollOrchestrator(TestCase):

    def test_happy_path_all_steps_succeed(self):
        run_id = self.orchestrator.run(
            business_unit_id=self.bu.id, period_month=6, period_year=2025, ctx=self.ctx
        )
        state = OrchestratorState.objects.get(entity_id=run_id)
        self.assertEqual(state.status, 'completed')
        event = EventOutbox.objects.get(event_type='payroll.generated')
        self.assertIsNotNone(event)

    def test_compensation_runs_when_step_2_fails(self):
        with patch.object(self.salary_service, 'compute', side_effect=Exception("compute failed")):
            with self.assertRaises(Exception):
                self.orchestrator.run(
                    business_unit_id=self.bu.id, period_month=6, period_year=2025, ctx=self.ctx
                )
        state = OrchestratorState.objects.get(workflow_id=ANY)
        self.assertEqual(state.status, 'failed')
```

### 4.14 Module Subscription & Feature Flag Testing (MANDATORY)

```python
class TestModuleSubscriptionMiddleware(TestCase):

    def test_subscribed_module_returns_200(self):
        BusinessUnitModule.objects.create(
            business_unit_id=self.bu.id, module__code='PAYROLL', status='active'
        )
        response = self.client.get('/api/v1/payroll/runs/', **self.auth_headers)
        self.assertEqual(response.status_code, 200)

    def test_unsubscribed_module_returns_403(self):
        response = self.client.get('/api/v1/payroll/runs/', **self.auth_headers)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['error']['code'], 'MODULE_NOT_SUBSCRIBED')

    def test_module_check_after_rbac(self):
        response = self.client.get('/api/v1/payroll/runs/', **self.unauth_headers)
        self.assertEqual(response.status_code, 401)  # Auth fails before module check

class TestFeatureFlagService(TestCase):

    def test_tenant_override_takes_precedence(self):
        BusinessUnitFeature.objects.create(
            business_unit_id=self.bu.id, feature_code='advanced_payroll', enabled=True
        )
        self.assertTrue(FeatureService.is_enabled(self.bu.id, 'advanced_payroll'))

    def test_plan_minimum_gates_feature(self):
        # BU on FREE plan, advanced_payroll requires PRO
        self.assertFalse(FeatureService.is_enabled(self.bu.id, 'advanced_payroll'))
```

### 4.15 Correlation ID Propagation Testing (MANDATORY)

```python
class TestCorrelationIdPropagation(TestCase):

    def test_correlation_id_in_api_response_header(self):
        response = self.client.get('/api/v1/hrms/employees/', **self.auth_headers)
        self.assertIn('X-Correlation-Id', response)
        self.assertEqual(len(response['X-Correlation-Id']), 36)  # UUID format

    def test_correlation_id_in_response_meta(self):
        response = self.client.get('/api/v1/hrms/employees/', **self.auth_headers)
        self.assertIn('correlation_id', response.data['meta'])

    def test_correlation_id_propagated_to_audit_log(self):
        response = self.client.post('/api/v1/hrms/employees/', self.employee_data, **self.auth_headers)
        correlation_id = response['X-Correlation-Id']
        audit = AuditLog.objects.filter(correlation_id=correlation_id).first()
        self.assertIsNotNone(audit)

    def test_correlation_id_propagated_to_outbox_event(self):
        response = self.client.post('/api/v1/attendance/finalize/', {}, **self.auth_headers)
        correlation_id = response['X-Correlation-Id']
        event = EventOutbox.objects.filter(correlation_id=correlation_id).first()
        self.assertIsNotNone(event)
```

---

## 5. NON-NEGOTIABLE RULES

- Security tests missing = CRITICAL - block deployment
- Tenant isolation tests missing = CRITICAL - block deployment
- RBAC tests missing = CRITICAL - block deployment
- CI/CD gate failing = deployment BLOCKED
- No test coverage on Service Layer logic = PROHIBITED
- Test data not factory-based = MEDIUM violation

---

## 6. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 7. QUICK SUMMARY

- Every feature MUST have: unit tests, integration tests, security tests
- Tenant isolation MUST be verified by tests on every data access operation
- RBAC MUST be verified for every endpoint
- CI/CD MUST gate ALL deployments on test results
- Test names MUST be descriptive (scenario + expected result)

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.
