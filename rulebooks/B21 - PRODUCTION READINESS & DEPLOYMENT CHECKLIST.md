<!-- yss_orbit\rulebooks\B21 - PRODUCTION READINESS & DEPLOYMENT CHECKLIST.md -->
# B21 - PRODUCTION READINESS & DEPLOYMENT CHECKLIST

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** ALL B-Series, C-Series, F-Series, X-Series
**Governance Role:** Production Release Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Go-live readiness gate, pre-deployment validation checklist, governance compliance verification, architecture audit, security audit summary, rollback readiness, post-deployment validation |
| REFERENCES | ALL rulebooks - this is the final enforcement gate |
| MUST NOT DUPLICATE | Any specific rule (this checklist REFERENCES, not redefines) |

---

## 1. PURPOSE

This rulebook defines the **production readiness checklist** for YSS Orbit.

No feature, module, or system change MUST reach production without passing this checklist.

---

## 2. MANDATORY PRE-DEPLOYMENT VALIDATION

### 2.1 Architecture Compliance

```text
□ Layered architecture enforced (View → Service → Repository → DB)
□ No business logic in Views or Models
□ No direct ORM access outside Repository Layer
□ Services return DTOs only (no Django model objects)
□ Module isolation enforced (no cross-module internal access)
□ Soft UUID references used across module boundaries (no physical FKs)
□ All repository folders named 'repositories/'
□ Dependency direction verified (no circular imports)
```

### 2.2 Tenant Isolation

```text
□ All tenant-owned tables include business_unit_id (NOT NULL)
□ All user-facing queries include business_unit_id AND is_deleted=False
□ Object-level fetch includes business_unit_id (no PK-only fetches)
□ Service Layer validates selected_business_unit_id vs allowed_business_unit_ids
□ Tenant-aware unique constraints applied (business_unit_id + field)
□ Cross-tenant FK relationships tested and blocked
□ Cache keys include business_unit_id for tenant-owned data
□ Background jobs carry business_unit_id for tenant-owned operations
□ Signed URLs validated for tenant ownership before generation
□ NO_SCOPE usage reviewed and documented
```

### 2.3 RBAC & Authorization

```text
□ All endpoints have permission checks
□ Deny-by-default enforced (no implicit grants)
□ RBAC evaluated BEFORE tenant scope check
□ User permission overrides tested (grant and revoke)
□ Permission cache invalidated on role or membership changes
□ All menu items have permission_code (SQL check passes)
□ GLOBAL scope tested - still enforces RBAC
□ No role-name-based authorization (permission codes only)
```

### 2.4 Authentication

```text
□ JWT in HttpOnly cookies (__Host- prefix in production)
□ Token type validation enforced (access vs refresh)
□ Permissions re-fetched from DB on refresh (not from token)
□ CSRF initialization endpoint available (/api/init/)
□ Session invalidation on logout verified
□ MFA enforced for admin users
□ Account lockout after 5 failed attempts
□ Password complexity requirements enforced
```

### 2.5 Database & Migrations

```text
□ All migrations use zero-downtime pattern where applicable
□ Migrations tested on staging DB before production
□ All migrations are reversible (rollback tested)
□ No destructive migrations without explicit approval
□ Audit log table is append-only (no UPDATE/DELETE paths exist)
□ All timestamp columns use TIMESTAMPTZ (UTC)
□ Financial data uses DECIMAL/NUMERIC (no FLOAT)
□ UUID primary keys on all tables
□ All indexes defined for frequently queried columns
```

### 2.6 API Standards

```text
□ All APIs versioned under /api/v1/
□ All responses use standard envelope (success, data, error, meta)
□ Pagination enforced on all list endpoints (MAX_PAGE_SIZE validated)
□ All APIs have rate limiting
□ Breaking changes create new API version
□ All public endpoints documented
□ Error codes follow X02 standard
□ trace_id present in all responses
```

### 2.7 Security

```text
□ DEBUG = False in production
□ All security headers present (X-Frame-Options, HSTS, CSP, nosniff)
□ CORS whitelist configured (no wildcard)
□ Passwords hashed with Argon2 or bcrypt
□ Sensitive data not in logs or API responses
□ Parameterized queries used (no raw string concatenation)
□ Secrets in env vars or vault (not in code or version control)
□ SQL injection tests pass
□ Timing attack resistance verified for security-critical comparisons
```

### 2.8 File Handling

```text
□ File type whitelist enforced (no executable uploads)
□ Files stored in cloud storage (not local filesystem)
□ Tenant-owned files include business_unit_id in metadata
□ Signed URLs require authentication + RBAC + tenant validation
□ Cross-tenant file access tests pass (blocked)
□ Malware scanning configured in production
```

### 2.9 Logging & Monitoring

```text
□ All mutations log old_values and new_values
□ Audit log writes are fire-and-forget (never crash main operation)
□ trace_id propagates through all layers and tasks
□ No PII in application logs
□ Monitoring dashboards configured for new features
□ Alerts configured for: error rate, slow queries, queue depth, security events
□ Health check endpoints responding (/health/, /health/ready/)
```

### 2.10 Performance & Scalability

```text
□ Stateless services (no in-memory session state)
□ Connection pooling configured
□ Cache scoped correctly (tenant-safe keys, TTL defined as constants)
□ Long-running operations moved to background tasks
□ Slow query detection active (200ms WARNING / 500ms CRITICAL)
□ Graceful shutdown configured
□ Health check endpoints available
```

### 2.11 Compliance

```text
□ Data classification documented per table (Tenant-Owned / Platform / Audit)
□ PII identified and access controlled
□ Retention policies configured
□ Consent mechanisms in place where applicable
□ Data deletion/anonymization process tested
□ Break-glass access process documented
```

### 2.12 Deployment Safety

```text
□ CI/CD gates all passed
□ Staging deployment successful
□ Staging smoke tests pass
□ Rollback plan documented and tested
□ Feature flags configured correctly
□ Seed data tested for idempotency
□ Environment variables validated at startup (fail-fast)
□ Team briefed on release changes
```

---

## 3. POST-DEPLOYMENT VALIDATION

After every production deployment:

```text
□ Health check endpoints pass (/health/ready/)
□ Critical user flows verified (login, core actions)
□ Error rates normal (< 0.1% 5xx)
□ Slow query alerts not firing
□ Monitoring dashboards showing expected metrics
□ Audit logs generating correctly
□ No unexpected permission errors in logs
```

If ANY post-deployment check fails → IMMEDIATE ROLLBACK.

---

## 4. GOVERNANCE COMPLIANCE GATE

Before production deployment, the following governance checks MUST pass:

```sql
-- Menu items missing permission_code
SELECT COUNT(*) FROM navigation_menu_items
WHERE permission_code IS NULL OR permission_code = '';
-- Expected: 0

-- Tenant-owned records missing business_unit_id
SELECT COUNT(*) FROM inventory WHERE business_unit_id IS NULL AND is_deleted = FALSE;
-- Expected: 0

-- Audit logs missing old_values or new_values for UPDATE actions
SELECT COUNT(*) FROM audit_logs
WHERE action LIKE '%_UPDATE' AND (old_values IS NULL OR new_values IS NULL);
-- Expected: 0
```

Any failing SQL check = DEPLOYMENT BLOCKED.

---

## 5. RELEASE AUTHORITY

Production deployments MUST be approved by:

| Change Type | Required Approvers |
|------------|-------------------|
| Standard feature release | Engineering Lead |
| Security-related change | Engineering Lead + Security Lead |
| Database schema change | Engineering Lead + Architecture Review |
| RBAC or permission change | Engineering Lead + Security Lead |
| Break-glass emergency | Engineering Lead + Security Lead (post-incident review within 48h) |

---


### 5.8 E-Series Compliance Checklist (MANDATORY)

Before any production deployment, ALL of the following MUST be verified:

**E01 - Event-Driven Architecture**
- [ ] All cross-module async operations use domain events (no direct cross-module service calls)
- [ ] All events published via Outbox Pattern (within same DB transaction as business operation)
- [ ] All events carry: event_id, event_type, event_version, business_unit_id, correlation_id, occurred_at
- [ ] All event consumers are idempotent (processed_event deduplication table in use)
- [ ] Dead-letter table exists and is monitored with alerts
- [ ] All event types registered in E01 §4.8 catalogue (or ARB-approved extension)
- [ ] Event versioning implemented - consumers handle multiple versions

**E02 - Orchestration Services**
- [ ] All multi-step cross-module workflows use Orchestration Services
- [ ] All orchestrators persist state to orchestrator_state table
- [ ] Compensation logic implemented for all steps with side effects
- [ ] Orchestrator tests cover: happy path, each step failure, compensation, idempotency
- [ ] All orchestrators publish domain event on completion

**E03 - Observability**
- [ ] correlation_id middleware active and generating UUIDs on every request
- [ ] correlation_id propagated to: all log entries, background jobs, domain events, audit logs
- [ ] All log entries are JSON-structured (no plain text log lines)
- [ ] APM tool (Datadog / Grafana Tempo / Elastic APM) configured and receiving traces
- [ ] All SLO alerts configured (E03 §3.7)
- [ ] Health check endpoints active: /health/, /health/ready/, /health/details/
- [ ] /health/ready/ returns "degraded" when outbox pending > 100

**E04 - Platform Governance**
- [ ] Module registry seeded (all modules in E04 §3.1)
- [ ] Module subscription middleware active in API pipeline (after auth, after RBAC)
- [ ] Module dependency enforcement active
- [ ] Subscription plans seeded (FREE, BASIC, PRO, ENTERPRISE)
- [ ] Feature flags seeded (all flags in E04 §3.7 catalogue)
- [ ] PlanLimitService enforcing user and module limits
- [ ] FeatureService resolving flags via DB + cache
- [ ] Module subscription cache invalidation wired to subscription changes
- [ ] Plan limit exceeded returns 402 with PLAN_LIMIT_EXCEEDED error code

### 5.9 Terminology Compliance Check (MANDATORY)

Before any production deployment, verify:

- [ ] No code, migration, or seed file uses "sector", "sector_id", or "sector_code" - all replaced with "domain"
- [ ] No direct cross-module service calls for async operations (grep codebase)
- [ ] No plain-text (non-JSON) log lines in production logging config
- [ ] All background job tasks carry and propagate correlation_id
- [ ] All API responses include correlation_id in meta and X-Correlation-Id header

### 5.3 Database Readiness - Additional Checks (MANDATORY)

In addition to §2.5, verify:

- [ ] event_outbox table exists with correct schema (B08 §4.17)
- [ ] event_dead_letter table exists with correct schema (B08 §4.18)
- [ ] orchestrator_state table exists with correct schema (B08 §4.19)
- [ ] processed_event table exists with correct schema (B08 §4.20)
- [ ] High-volume tables partitioned: attendance_logs, audit_log, payroll_runs (B08 §4.21)
- [ ] Partition creation automation scheduled (Celery Beat job)
- [ ] All outbox indexes created (idx_outbox_pending, idx_outbox_event_id, idx_outbox_bu)
- [ ] domain table exists and seeded (B17 §3.10) - "sector" table retired

### 5.5 Background Worker Readiness - Additional Checks (MANDATORY)

In addition to any existing checks, verify:

- [ ] Outbox worker Celery Beat schedule configured (every 5 seconds)
- [ ] Separate Celery queues per module (queue_payroll, queue_inventory, queue_hrms)
- [ ] Queue depth monitoring alerts configured (alert if queue depth > 500)
- [ ] Dead-letter alert routing configured (PagerDuty / Slack)
- [ ] Event consumer tasks registered and discoverable


## 6. NON-NEGOTIABLE RULES

- Skipping the pre-deployment checklist = PROHIBITED (CRITICAL)
- Deploying with any CRITICAL gate failing = PROHIBITED
- Deploying without a rollback plan = PROHIBITED
- Skipping post-deployment validation = PROHIBITED
- E-series compliance checklist not completed = PROHIBITED
- Terminology compliance check not completed = PROHIBITED

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECTURE REVIEW BOARD APPROVAL.
