<!-- yss_orbit\rulebooks\B01 - SYSTEM FOUNDATION & PRINCIPLES.md -->
# B01 - SYSTEM FOUNDATION & PRINCIPLES

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW - HIGHEST AUTHORITY
**Applies To:** ALL systems, ALL modules, ALL environments, ALL teams
**Governance Role:** Global Architecture Authority - All rulebooks derive from B01

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Global architecture law, canonical terminology, layered architecture, security context, API contract standard, soft delete, validation ownership, caching law, audit law, background job law, idempotency law, rate limiting law, configuration law, file handling law, observability law, API lifecycle law, orchestration layer, event publishing law, module subscription law |
| REFERENCES | B02 (tenant enforcement), B07 (RBAC), B15 (logging implementation), C01–C04 (compliance), E01 (domain events), E02 (orchestration), E03 (observability), E04 (module governance) |
| MUST NOT DUPLICATE | Tenant isolation specifics (B02), RBAC specifics (B07), auth specifics (B06), DB specifics (B08) |

---

## 1. PURPOSE

This rulebook defines the **mandatory system foundation** for the entire YSS Orbit platform.

It establishes:

- Core architecture model
- Global system behavior standards
- Foundational security principles
- Base contracts governing all modules
- Canonical terminology used across all rulebooks

This rulebook is the **highest authority** for all system design.

All other rulebooks (B02–B26, E01–E04, F01–F11, C01–C04, X01–X04):

- MUST comply with this rulebook
- MUST NOT override this rulebook
- MUST NOT introduce conflicting behavior
- MUST NOT redefine terms defined here

---

## 2. SCOPE

This rulebook applies to:

- Backend systems (Django, DRF, services, repositories)
- Frontend systems (React, API integration, state handling)
- All API contracts
- Authentication and authorization
- Database access layers
- Error handling and logging
- Monitoring and observability
- Caching and performance
- All environments (development, staging, production)

No component is exempt.

---

## 3. CANONICAL TERMINOLOGY (GLOBAL LOCK)

All rulebooks across the entire framework MUST use these definitions. No alternative terms are permitted.

| Term | Definition | Alternative Terms PROHIBITED |
|------|-----------|------------------------------|
| **Organization** | Parent company/entity that owns one or more Business Units | company, client, tenant-org |
| **BusinessUnit** | Tenant boundary representing an operational unit/branch under an Organization. This is the REAL tenant boundary. | tenant, branch, outlet, shop, bu |
| **User** | Global authenticated identity - NOT tied to a single Business Unit | member, employee (as identity concept) |
| **UserBusinessUnit** | Membership mapping connecting User ↔ BusinessUnit ↔ Role | user-tenant-mapping, membership |
| **`security_context`** | Backend-generated, immutable, per-request object containing identity, tenant scope, permissions, trace metadata | auth_context, request_context |
| **`business_unit_id`** | Ownership column on tenant-owned data records | tenant_id, bu_id, company_id, branch_id |
| **`selected_business_unit_id`** | Active Business Unit for this specific request (from header, validated by backend) | current_bu, active_tenant |
| **`allowed_business_unit_ids`** | Backend-derived frozenset of all BUs the authenticated user may access | permitted_bus, authorized_tenants |
| **`data_scope`** | RBAC access breadth - `BUSINESS_UNIT` or `GLOBAL` | scope, access_level |
| **GLOBAL scope** | Expanded tenant visibility granted after RBAC approval - NOT unrestricted access | super access, admin bypass |
| **Tenant-Owned Data** | Data owned by one BusinessUnit - requires `business_unit_id NOT NULL` | tenant data, BU data |
| **Platform Data** | Global system data not tied to any tenant - NO `business_unit_id` | global data, system data |
| **Soft Delete** | Logical deletion using `is_deleted = True` + `deleted_at` timestamp | logical delete |
| **RBAC** | Role-based access control | permissions system |
| **DTO** | Plain data transfer structure between layers (dict, dataclass, typed object) | response object |
| **Audit Log** | Immutable, compliance-grade record of security-relevant or data-changing activity | event log, activity log |
| **Idempotency** | Guarantee that repeated identical requests do not create duplicate side effects | deduplication |
| **Background Job** | Asynchronous worker task outside the request/response cycle | async task, celery task |
| **Break-Glass Access** | Emergency override - strictly time-limited, explicitly granted, fully audited | emergency access |
| **Domain** | Business ecosystem category (Retail, Pharmacy, HRMS, Manufacturing) - NOT a tenant, NOT a module | **Sector ← RETIRED AND PROHIBITED** |
| **Module** | Functional capability within the platform (POS, Payroll, Attendance) | feature, plugin, component |
| **Orchestrator** | A Service that owns a multi-step cross-module workflow, handles failures, and publishes the final domain event | workflow manager, coordinator |
| **Domain Event** | Immutable versioned async record that something significant happened - published via Outbox Pattern | message, signal, hook |
| **Bounded Context** | Module-level domain isolation boundary - each module owns its own data, models, and logic | service boundary, domain scope |
| **Outbox Pattern** | Writing domain events to a DB table within the same transaction as the business operation | transactional outbox |
| **`correlation_id`** | UUID generated per user action at API entry, propagated through all systems, jobs, events, and audit logs | operation_id |
| **BrandingMode** | 'platform' \| 'co_brand' \| 'white_label' (B22) | theme, skin, style |
| **LifecycleStage** | 'alpha' \| 'beta' \| 'ga' \| 'deprecated' \| 'retired' (B23) | status, phase |

**CRITICAL TERMINOLOGY ENFORCEMENT:** "Sector" is RETIRED from v3.0 onward. "Domain" is the ONLY canonical term for business ecosystem category. All code, database fields, seed scripts, and documentation MUST use "Domain" (or `domain`). "sector", "sector_id", "sector_code" are PROHIBITED.

---

## 4. ARCHITECTURE OVERVIEW

### 4.1 Platform Hierarchy

```text
YSS Orbit Platform
      ↓
Organization (Parent company/entity)
      ↓
Domain (Classification only - NOT a tenant boundary)
      ↓
BusinessUnit (TENANT BOUNDARY - data isolation unit)
      ↓
UserBusinessUnit (Membership mapping: User ↔ BU ↔ Role)
      ↓
User (Global identity - may belong to multiple BUs)
      ↓
Role → RolePermission → Permission
```

### 4.2 Request Processing Architecture

```text
Client
  ↓
API/View Layer (HTTP: parse, validate, call service, format response)
  ↓
Service Layer (Business logic, RBAC, tenant enforcement, orchestration, audit)
  ↓
Repository Layer (ORM/DB access, query filtering, tenant-scoped queries)
  ↓
Database (PostgreSQL - integrity constraints, indexes, migrations)
```

### 4.3 Architecture Rules

- Each layer MUST have a single responsibility
- Layer skipping is PROHIBITED
- Business logic in Views is PROHIBITED
- DB access outside Repository is PROHIBITED
- Service return values MUST be DTO/plain data and MUST NOT be Django model objects
- Repository folder naming MUST use `repositories/`

### 4.4 Orchestration Layer (MANDATORY)

Between Service Layer and Repository Layer, complex cross-module workflows MUST use Orchestration Services (governed by E02):

```
Client Request
    ↓
API/View Layer
    ↓
Service Layer (simple single-module operations)
    ↓
Orchestration Services (multi-step cross-module workflows)
    ↓
Repository Layer
    ↓
Database
```

Cross-module orchestration rules: see E02.
Domain event standards: see E01.
Observability standards: see E03.
Module registry governance: see E04.

### 4.5 Allowed Dependency Direction

```text
api/views → services → repositories → models/db
```

### 4.6 PROHIBITED Dependency Directions

```text
api/views → models                (PROHIBITED)
api/views → repositories          (PROHIBITED)
services  → api/views             (PROHIBITED)
services  → serializers           (PROHIBITED)
services  → model.objects         (PROHIBITED)
repositories → services           (PROHIBITED)
module A → module B internal      (PROHIBITED - use public service interface)
```

---

## 5. CORE GOVERNANCE LAWS

### 5.1 Layered Architecture (MANDATORY)

- API/View Layer MUST handle HTTP concerns only: request parsing, serializer validation, permission class invocation, service calls, response formatting
- API/View Layer MUST NOT access ORM, models, or repositories directly
- API/View Layer MUST NOT contain business logic
- Service Layer MUST contain business logic and orchestration
- Service Layer MUST NOT access HTTP request/response objects
- Service Layer MUST NOT import or use DRF serializers
- Service Layer MUST NOT call `model.objects` or direct ORM queries
- Repository Layer MUST contain all ORM/database access
- Repository Layer MUST NOT access request, user, HTTP, or `security_context` objects
- Models MUST be persistence definitions only
- Business orchestration in models or signals is PROHIBITED
- Cross-layer leakage is PROHIBITED

### 5.2 Naming Standards (MANDATORY)

- Backend: `snake_case` for variables/functions, `PascalCase` for classes, `UPPER_SNAKE_CASE` for constants
- Frontend: `camelCase` for variables/functions, `PascalCase` for components
- Backend repository folders MUST use `repositories/`
- `business_unit_id` REQUIRED on all tenant-owned tables
- Alternative tenant-column names are PROHIBITED

### 5.3 API Response Standard (MANDATORY)

All API responses MUST follow the standard envelope. Raw DRF responses are PROHIBITED.

#### Success Response

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

#### Error Response

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-facing error message",
    "details": {}
  },
  "meta": {}
}
```

#### Meta (Pagination + Correlation)

```json
{
  "meta": {
    "pagination": {
      "total": 100,
      "limit": 25,
      "offset": 0,
      "has_next": true,
      "has_prev": false
    },
    "trace_id": "uuid",
    "correlation_id": "uuid"
  }
}
```

Rules:
- `error` MUST be used; `errors` is PROHIBITED
- `trace_id` MUST be placed in `meta`
- `correlation_id` MUST be placed in `meta`
- Pagination MUST be placed in `meta.pagination`
- All API responses MUST be created by the central response builder
- A global `MAX_PAGE_SIZE` limit is REQUIRED - requests exceeding it MUST be rejected
- Unbounded queries are PROHIBITED

### 5.4 Error Handling (MANDATORY)

- Centralized exception handling REQUIRED
- Services MUST raise typed application exceptions
- Services MUST NOT return error dictionaries
- Views MUST NOT contain broad business `try/except` logic
- Global exception handler MUST map exceptions to HTTP responses
- Stack traces MUST NOT be exposed to clients
- SQL errors and internal exception messages MUST NOT be exposed to clients
- 4xx errors = expected domain failures
- 5xx errors = system failures; MUST be logged or persisted

Mandatory error flow:

```text
Service detects domain problem
  → raises AppException subclass
  → global exception handler catches it
  → ResponseBuilder returns standard API envelope
```

### 5.5 Soft Delete & Model Lifecycle Fields (MANDATORY)

Hard delete is PROHIBITED for business data.

**Required fields on all long-lived entities:**

```python
is_active     = models.BooleanField(default=True)
is_deleted    = models.BooleanField(default=False)
created_at    = models.DateTimeField(auto_now_add=True)   # UTC
updated_at    = models.DateTimeField(auto_now=True)        # UTC
created_by_id = models.UUIDField(null=True, blank=True)
updated_by_id = models.UUIDField(null=True, blank=True)
```

**REQUIRED for all soft-deletable models (any model that can be logically deleted):**

```python
deleted_at    = models.DateTimeField(null=True, blank=True)
deleted_by_id = models.UUIDField(null=True, blank=True)
```

Soft delete MUST use `deleted_at` timestamp (REQUIRED) + `is_deleted = True` + `is_active = False`.

Database uniqueness on soft-deletable fields MUST use partial indexes:

```sql
CREATE UNIQUE INDEX ON my_table (business_unit_id, code)
WHERE is_deleted = FALSE;
```

Default user-facing queries MUST exclude deleted records AND inactive records.

**Violation:** Returning deleted or inactive records to users = data integrity violation (CRITICAL).

### 5.6 Validation Ownership (MANDATORY)

Backend validation is the ONLY trusted validation source.

| Layer | Responsibility |
|-------|----------------|
| API/View Serializer | Request shape, required fields, types, format, length, enum values |
| Service Layer | Business rules, tenant access, permission-sensitive constraints, state transitions, uniqueness intent, cross-domain rules |
| Repository Layer | Query safety, required tenant scope, safe UUID parsing |
| Database | Unique constraints, nullability, integrity constraints, indexes, check constraints |

Rules:
- Serializers MUST NOT query the database for business rules
- Serializers MUST NOT call repositories or services
- Serializers MUST NOT enforce tenant or RBAC rules
- Business validation MUST live in Service Layer
- Database constraint errors MUST be converted into safe API errors

### 5.7 Security Context (MANDATORY)

The `security_context` is generated once per request by backend authentication/security middleware or a dedicated backend factory. It is immutable after creation.

**Required structure:**

```python
SecurityContext(
    user_id: UUID | None,
    is_authenticated: bool,
    selected_business_unit_id: UUID | None,
    allowed_business_unit_ids: frozenset[UUID],
    permission_codes: frozenset[str],
    role_codes: frozenset[str],
    data_scope: Literal["BUSINESS_UNIT", "GLOBAL"],
    trace_id: str,
    correlation_id: UUID,
    request_id: str | None,
    ip_address: str | None,
    user_agent: str | None,
)
```

Rules:
- `security_context` MUST be created ONLY by backend authentication/security middleware or a dedicated backend factory
- `security_context` MUST be immutable after creation
- `security_context` MUST be passed explicitly as function arguments into Service Layer
- Services MUST NOT reconstruct `security_context` from client input
- Client-selected Business Unit header MAY populate `selected_business_unit_id` only after backend validation
- Thread-local storage is PROHIBITED for business decisions
- `security_context` MUST NOT be derived from client input alone
- `is_super_admin` or role names MUST NOT bypass permission checks

**Violation:** Using client-provided `business_unit_id` without backend validation = CRITICAL security breach.

### 5.8 No Hardcoding (MANDATORY)

- Hardcoded secrets are PROHIBITED
- Hardcoded URLs are PROHIBITED
- Business rules MUST NOT depend on display names or hardcoded IDs
- Config MUST use env variables or named constants

### 5.9 Data Integrity (MANDATORY)

- Transactions REQUIRED for multi-step write operations
- Partial writes PROHIBITED
- Multi-repository writes MUST use one Service Layer transaction boundary
- Database constraints REQUIRED for final integrity enforcement
- All CREATE, UPDATE, and DELETE operations MUST generate immutable audit logs

### 5.10 Timezone Standard (MANDATORY)

- All system timestamps MUST use UTC
- Database storage MUST use `TIMESTAMPTZ` - UTC only
- Timezone conversion MUST occur only at frontend/presentation layer
- Tenant-specific timezone handling MUST follow B26

### 5.11 Data Classification (MANDATORY)

Every table MUST be explicitly classified before schema design:

| Class | Definition | Requires `business_unit_id`? |
|-------|-----------|------------------------------|
| Tenant-Owned | Data owned by a specific BusinessUnit | YES (NOT NULL) |
| Platform/Global | System-level data not tied to any tenant | NO |
| Audit/Security | Append-only event records | Only if tenant-scoped event |

A developer MUST NOT assume "all tables need `business_unit_id`". Classification MUST be explicit.

### 5.12 Identifier Usage Law (MANDATORY)

Every entity uses three identifier types. Each has a strict purpose.

| Type | Format | Purpose | Stability |
|------|--------|---------|-----------| 
| Primary Key | `id` (UUID) | Database relationships and lookup | Permanent |
| Business Code | `*_code` | Logic, permissions, decisions | Stable after production |
| Display Name | `name` / `*_name` | UI labels only | Can change anytime |

**Rule: ID → Relationships. CODE → Logic. NAME → Display ONLY.**

```python
# DO:
if domain.domain_code == "RETAIL":
    load_retail_module()  # Code is stable

# DO NOT:
if domain.name == "Retail":          # PROHIBITED - names change
    load_retail_module()
if business_unit_id == "abc":        # PROHIBITED - hardcoded ID
    apply_special_rule()
```

Permission codes MUST use lowercase dot-notation, format `{module}.{resource}.{action}` (e.g., `hrms.employee.view`, `inventory.stock.adjust`), and MUST be immutable after production — governed by B07 §5.16.

### 5.13 Organization Consistency Enforcement (MANDATORY)

- Every BusinessUnit MUST belong to exactly one Organization
- BusinessUnit.organization_id MUST be immutable after creation unless an approved migration workflow exists
- Cross-organization tenant linkage is PROHIBITED
- Tenant membership MUST respect organization ownership
- Cross-organization reporting MUST require explicit RBAC authorization
- Organization-level aggregation MUST validate BusinessUnit ownership integrity

**Violation:** Cross-organization tenant linkage = CRITICAL architecture violation.

### 5.14 GLOBAL Scope Rules (MANDATORY)

`data_scope = "GLOBAL"` is the ONLY mechanism for cross-tenant access. It expands tenant scope ONLY.

GLOBAL scope DOES NOT bypass:
- authentication
- RBAC permission validation
- audit logging
- soft delete filtering
- security enforcement
- observability requirements

### 5.15 Tenant Enforcement (MANDATORY)

Tenant enforcement MUST occur at two independent layers.

**Service Layer Enforcement:**
- Service Layer MUST derive tenant scope from `security_context`
- Service Layer MUST validate `selected_business_unit_id` against `allowed_business_unit_ids`
- Service Layer MUST assign tenant ownership from `security_context`
- Service Layer MUST block cross-tenant writes before repository mutation

**Repository Layer Enforcement:**
- Tenant-owned queries MUST require `business_unit_id`
- Tenant-owned object fetches MUST include both `id` and `business_unit_id`
- PK-only fetches for tenant-owned records are PROHIBITED

**Violation:** Missing tenant filtering on tenant-owned data = CRITICAL tenant leak.

### 5.16 Transaction Management (MANDATORY)

Transactions belong ONLY in the Service Layer.

- Views MUST NOT open transactions
- Repositories MUST NOT call `transaction.atomic()`
- Domain events MUST be published inside the same transaction as the business operation (Outbox Pattern)
- External API/network calls MUST NOT run inside DB transactions unless explicitly required

### 5.17 Service Return Contract (MANDATORY)

Services MUST NOT return Django model objects to API/View Layer.

Allowed service returns: `dict`, `list[dict]`, dataclasses/DTOs, typed result objects.
Prohibited service returns: Django model instances, QuerySets, DRF serializers, DRF `Response`.

### 5.18 REST API URL Rules (MANDATORY)

```text
/api/v1/{resources}/
/api/v1/{resources}/{id}/
/api/v1/{resources}/{id}/{sub-resources}/
```

Standard module URL namespacing:
```text
/api/v1/hrms/employees/
/api/v1/payroll/runs/
/api/v1/inventory/items/
/api/v1/pos/bills/
/api/v1/platform/business-units/
/api/v1/platform/modules/
/api/v1/jobs/{job_id}/
/health/
/health/ready/
```

Rules: URLs MUST use plural resources, kebab-case, version under `/api/v1/`. Verbs in URLs are PROHIBITED.

### 5.19 Backward Compatibility (MANDATORY)

- Breaking changes MUST NOT silently break existing clients
- Breaking changes REQUIRE API versioning or a compatibility adapter
- Silent behavior changes inside an existing version are PROHIBITED

### 5.20 Module Boundary Enforcement (MANDATORY)

- Modules MUST NOT access another module's internal models or repositories
- Direct cross-module database access is PROHIBITED
- Cross-module physical foreign keys are PROHIBITED
- Cross-module references MUST prefer soft UUID references
- Async cross-module communication MUST use domain events (E01)
- Multi-step cross-module workflows MUST use Orchestration Services (E02)

### 5.21 Query Standards (MANDATORY)

- `SELECT *` is PROHIBITED for application queries
- All user-facing queries MUST include `is_deleted = FALSE`
- Tenant-owned queries MUST include `business_unit_id`
- Unbounded queries are PROHIBITED
- N+1 query patterns are PROHIBITED
- Raw SQL is PROHIBITED unless explicitly reviewed, parameterized, documented, and covered by tests

### 5.22 Caching Rules (MANDATORY)

- Cache MUST NOT be the source of truth
- Cache keys MUST include tenant scope where applicable
- Cache MUST be invalidated on CREATE, UPDATE, DELETE, permission changes, role changes, tenant membership changes, and subscription changes
- Sensitive data MUST NOT be cached unless encrypted and access-scoped

**Violation:** Tenant-unsafe cache key = CRITICAL tenant leak.

### 5.23 Audit Logging (MANDATORY)

All data-changing operations MUST generate audit logs. Audit logs MUST include:
- `user_id`, `business_unit_id` where applicable, `action`, `old_values`, `new_values`, `timestamp`, `trace_id`, `correlation_id`, result status

Rules:
- Audit logs MUST be immutable - modification or deletion is PROHIBITED
- Audit logs MUST NOT store plaintext secrets, passwords, tokens, or sensitive file contents

**Violation:** Missing audit log for CREATE, UPDATE, or DELETE = compliance failure.

### 5.24 Rate Limiting (MANDATORY)

- Rate limits MUST be configurable per endpoint, user, tenant, IP, or client type
- Authentication, password reset, OTP, file upload, webhook, and public endpoints MUST have stricter limits
- Excess requests MUST return HTTP `429`
- Rate-limit bypass is PROHIBITED except for explicitly approved internal system operations

### 5.25 Configuration Rules (MANDATORY)

- All configs MUST come from environment variables or approved configuration files
- Hardcoded secrets are PROHIBITED
- Required configuration MUST be validated at startup
- System MUST fail fast if required configuration is missing or invalid

### 5.26 File Handling Rules (MANDATORY)

- File binaries MUST NOT be stored in the database
- File access MUST be authorized
- File access MUST enforce tenant scope where applicable
- Tenant-owned files MUST contain `business_unit_id`
- Signed URLs MUST validate tenant scope before generation
- Cross-tenant file access is PROHIBITED
- Files MUST be scanned for malware before serving (B11)
- Files MUST have a declared lifecycle policy (B11)

### 5.27 Observability (MANDATORY)

- `correlation_id` MUST be generated at API entry and propagated through ALL layers including background jobs and domain events
- `correlation_id` is DISTINCT from `trace_id` - see E03 for full distinction
- All logs MUST include `correlation_id`, `business_unit_id`, `user_id`, `module`, `duration_ms`
- All logs MUST be JSON-structured - plain text log lines are PROHIBITED
- Critical operations MUST be traceable across API, Service, Repository, async task, and external integration boundaries
- Logs MUST NOT contain secrets, passwords, tokens, or sensitive payloads

### 5.28 Idempotency Rules (MANDATORY)

Critical state-changing operations MUST be idempotent. Mandatory coverage:
- Payments, billing, credits, refunds, and financial operations
- External integrations and webhook processing
- File upload finalization, bulk imports and mutations
- Account creation and invitation flows
- Any operation triggering email, SMS, notification, or third-party side effects

### 5.29 Background Job Rules (MANDATORY)

Background jobs MUST be safe, observable, retryable, and tenant-aware.

- Background jobs MUST call Service Layer
- Background jobs MUST NOT contain business logic directly
- Background jobs MUST include `business_unit_id` for tenant-owned operations
- Background jobs MUST carry and propagate `correlation_id`
- Background jobs MUST be idempotent when retries are enabled
- Dead-letter handling REQUIRED for exhausted jobs

**Violation:** Background job directly mutating tenant data without Service Layer and tenant scope = CRITICAL architecture violation.

### 5.30 API Version Lifecycle Rules (MANDATORY)

- All public APIs MUST include URL versioning
- New breaking changes MUST create a new API version
- Deprecated versions MUST emit deprecation metadata or headers
- Silent behavior changes inside an existing version are PROHIBITED

### 5.31 Module Subscription Law (MANDATORY)

All API endpoints belonging to a module MUST enforce module subscription check:
- Authentication → RBAC → Module Subscription Check → Service Layer
- Module subscription check is governed by E04
- Unsubscribed module access MUST return 403 with error code `MODULE_NOT_SUBSCRIBED`

### 5.32 Event Publishing Law (MANDATORY)

Cross-module async communication MUST use domain events via the Outbox Pattern:
- Direct cross-module service calls for async operations are PROHIBITED
- All domain events MUST carry `correlation_id`, `business_unit_id`, and `event_version`
- Domain event standards: see E01
- Orchestration standards: see E02

---

## 6. SECURITY & COMPLIANCE SUMMARY

| Concern | Law |
|---------|-----|
| Authentication | JWT in HttpOnly cookies REQUIRED |
| Authorization | RBAC REQUIRED; order: Authentication → RBAC → Module Subscription Check → Tenant Scope |
| Tenant Security | Two-layer enforcement: Service (validate) + Repository (filter) |
| GLOBAL scope | RBAC first, then tenant expansion - never unrestricted |
| Object-level fetch | MUST include `business_unit_id` and `is_deleted=false` |
| Passwords | MUST be hashed (Argon2 or bcrypt) |
| PII in logs | PROHIBITED - use opaque UUIDs |
| Sensitive data | MUST NOT be logged, cached unencrypted, or returned in API responses |
| Injection | Parameterized queries REQUIRED at all input points |
| Rate limiting | REQUIRED on all APIs |
| Idempotency | REQUIRED for critical mutations |
| Audit logs | Immutable, append-only, with old_values and new_values |

---

## 6.1 GOVERNANCE HIERARCHY (MANDATORY)

Rulebooks are hierarchical.

```text
B01 (Global Authority)
 ├── B02–B26  (Backend/Platform Implementation Law)
 ├── C01–C04  (Compliance/Legal Enforcement)
 ├── E01–E04  (Event, Orchestration, Observability & Platform Governance)
 ├── F01–F11  (Frontend Implementation Law)
 └── X01–X04  (Shared Cross-System Standards)
```

Conflict resolution: B01 overrides ALL rulebooks.

---

## 7. ANTI-DRIFT GOVERNANCE (MANDATORY)

The following governance drift patterns are PROHIBITED:

- Architecture drift - developers bypassing layered architecture
- Naming drift - using alternative terms for canonical concepts (especially "Sector" instead of "Domain")
- Tenant enforcement drift - skipping `business_unit_id` filters
- RBAC inconsistency drift - bypassing permission checks
- API contract drift - inconsistent response shapes across modules
- Frontend/backend drift - frontend redefining backend security rules
- Deployment-process drift - manual deployments or skipped CI gates
- Audit inconsistency drift - missing or inconsistent audit logs
- Async processing drift - background jobs without tenant scope or correlation_id
- Cache-key inconsistency drift - unscoped cache keys
- Terminology drift - using non-canonical terms for platform concepts
- Event architecture drift - direct cross-module async calls instead of domain events

Any module, team, or developer introducing drift patterns MUST be blocked at PR review.

---

## 8. REUSABLE ENFORCEMENT INFRASTRUCTURE (MANDATORY)

Required reusable infrastructure:
- Base repository classes with tenant-scoped query helpers
- Centralized permission validator/decorator
- Security middleware (generates `security_context` with `correlation_id`)
- Cache key builder with tenant/user scope enforcement
- Audit log utility (fire-and-forget pattern)
- Response builder (standard API envelope, includes `correlation_id` in meta and `X-Correlation-Id` header)
- Typed exception hierarchy
- Async wrapper with tenant context propagation
- Transaction utility (Service Layer only)
- EventBus with Outbox Pattern integration
- CorrelationIdMiddleware
- ModuleSubscriptionMiddleware

Manually reimplementing tenant filtering, RBAC checks, or audit logging per feature is PROHIBITED.

---

## 9. GOVERNANCE EXCEPTION PROCESS

Any deviation from B01 governance MUST follow the exception process:

1. Exception MUST be submitted to Architecture Review Board for approval
2. Exception MUST be time-limited with explicit expiry
3. Exception MUST be fully documented with justification
4. Exception MUST be audited during and after use
5. Unapproved deviations are PROHIBITED

---

## 10. NON-NEGOTIABLE RULES

- Tenant isolation MUST be enforced by architecture, NOT developer memory
- Security enforcement MUST rely on reusable infrastructure, NOT manual implementation
- Layer violation = PROHIBITED (CRITICAL)
- RBAC bypass = PROHIBITED (CRITICAL)
- Tenant leak = PROHIBITED (CRITICAL)
- Hardcoding = PROHIBITED
- Validation skip = PROHIBITED
- Client-trusted `business_unit_id` = PROHIBITED (CRITICAL)
- Using display names in business logic = PROHIBITED
- Hard delete of business data = PROHIBITED (CRITICAL)
- Service returning Django models to API/View Layer = PROHIBITED
- ORM access outside Repository Layer = PROHIBITED
- Repository transaction management = PROHIBITED
- Verb-based API URLs = PROHIBITED
- Silent breaking changes = PROHIBITED
- `SELECT *` in application queries = PROHIBITED
- Unbounded queries = PROHIBITED
- Tenant-unsafe cache keys = PROHIBITED (CRITICAL)
- Missing audit log for CREATE, UPDATE, DELETE = PROHIBITED
- Missing API rate limit = PROHIBITED
- Hardcoded secrets, URLs, or environment logic = PROHIBITED
- Unauthorized file access = PROHIBITED (CRITICAL)
- Logs without `trace_id` or `correlation_id` = PROHIBITED
- Plain text (non-JSON) log lines = PROHIBITED
- Duplicate side effects without idempotency protection = PROHIBITED (CRITICAL)
- Background job direct ORM mutation = PROHIBITED
- Background job without tenant scope for tenant data = PROHIBITED (CRITICAL)
- Silent API version breaking change = PROHIBITED (CRITICAL)
- PII in audit logs = PROHIBITED (CRITICAL)
- Using `is_super_admin` to bypass RBAC = PROHIBITED (CRITICAL)
- Direct async cross-module service calls = PROHIBITED (use domain events)
- Event published outside DB transaction = PROHIBITED
- "Sector" terminology anywhere in code, DB, or docs = PROHIBITED

---

## 11. VIOLATIONS & ENFORCEMENT

Non-compliant code MUST NOT merge or deploy.

| Severity | Action |
|---------|--------|
| CRITICAL | Block release - immediate remediation required |
| HIGH | Reject PR - must be fixed before merge |
| MEDIUM | Fix required before next release |

---

## 12. TESTING REQUIREMENTS

- Unit tests REQUIRED for all service layer logic
- Repository tests REQUIRED for tenant filtering and query behavior
- Integration tests REQUIRED for all API endpoints
- Security tests REQUIRED (auth bypass, tenant isolation, permission enforcement)
- API contract tests REQUIRED
- Error response contract tests REQUIRED
- Cache key and invalidation tests REQUIRED where caching is used
- Audit logging tests REQUIRED for CREATE, UPDATE, DELETE
- Rate-limit tests REQUIRED for public and protected APIs
- Configuration validation tests REQUIRED
- Idempotency tests REQUIRED for covered state-changing operations
- Background job retry, idempotency, and tenant-scope tests REQUIRED
- API version lifecycle and backward compatibility contract tests REQUIRED
- Cache leakage tests REQUIRED
- Cross-tenant pagination tests REQUIRED
- correlation_id propagation tests REQUIRED (header, meta, audit log, outbox event, background job)
- Module subscription enforcement tests REQUIRED
- Failing tests MUST block deployment

---

## 13. QUICK REFERENCE SUMMARY

| Concern | Rule |
|---------|------|
| Architecture | API/View → Service → Repository → Database - no skipping |
| Repository naming | `repositories/` is the final standard |
| Tenant | `business_unit_id` on all tenant-owned data |
| Tenant enforcement | Two-layer: Service validates; Repository filters |
| Auth | JWT in HttpOnly cookies |
| Identity | ID (relationships) / CODE (logic) / NAME (display only) |
| Deletion | Soft delete only for business data |
| Context | `security_context` immutable, backend-only, explicit, carries `correlation_id` |
| GLOBAL scope | RBAC first, then tenant expansion |
| Transactions | Service Layer only - events use Outbox Pattern |
| Validation | Serializer shape → Service business rules → Repository safety → DB integrity |
| Errors | Service raises typed exception → global handler formats response |
| API response | `{ success, data, error, meta }` - meta includes `correlation_id` |
| URLs | Versioned REST resources; no verbs; module-namespaced |
| Service returns | DTO/plain data only; no model objects |
| Queries | Explicit, bounded, scoped, index-aware |
| Cache | Performance only; tenant-safe keys; invalidated on mutation |
| Audit | CREATE / UPDATE / DELETE logged immutably with old/new values + correlation_id |
| Rate limits | Required on all APIs |
| Config | Externalized, validated, fail-fast |
| Observability | `trace_id` and `correlation_id` on all logs; JSON-structured only |
| Idempotency | Critical mutations require scoped idempotency keys |
| Background jobs | Service-driven, retry-safe, tenant-aware, correlation_id-propagating |
| Terminology | Use ONLY canonical terms defined in Section 3 - "Sector" is PROHIBITED |
| Domain events | Outbox Pattern only - no direct cross-module async calls |
| Module subscriptions | Enforced at API entry after RBAC |

---

## 14. LANGUAGE ENFORCEMENT

- MUST / MUST NOT / REQUIRED / PROHIBITED ONLY
- Soft language (consider, try, prefer, ideally, should, recommended) is PROHIBITED in enforcement rules

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECTURE REVIEW BOARD APPROVAL.
