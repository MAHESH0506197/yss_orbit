<!-- yss_orbit\rulebooks\B04 - APPLICATION ARCHITECTURE (LAYERS, SERVICES, DJANGO APPS).md -->
# B04 - APPLICATION ARCHITECTURE (LAYERS, SERVICES, DJANGO APPS)

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01 (System Foundation), B02 (Multi-Tenant), B03 (Domain Model)
**Governance Role:** Application Architecture Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Layered architecture enforcement, Django app structure, service patterns, repository patterns, DTO/data flow contracts, code organization standards, Django model/signal restrictions, background task architecture |
| REFERENCES | B01 (architecture law, transaction rules, service return contract), B02 (tenant enforcement layers), B07 (RBAC in service layer) |
| MUST NOT DUPLICATE | security_context definition (B01), tenant isolation specifics (B02), RBAC rules (B07), DB schema rules (B08) |

---

## 1. PURPOSE

This rulebook defines the **application architecture structure** for YSS Orbit backend.

It establishes:
- Layered architecture design and enforcement
- Django app structure standards
- Service and repository patterns
- Code organization standards
- DTO and data flow contracts

All application code MUST follow this structure.

---

## 2. SCOPE

Applies to: all backend code (Django + DRF), all modules and Django apps, all services, repositories, and views, all API endpoints and business logic. No module or file is exempt.

---

## 3. DEFINITIONS

| Term | Definition |
|------|-----------|
| API/View Layer | HTTP entry point - DRF views, serializers, permission classes |
| Service Layer | Business logic, orchestration, tenant enforcement, transaction management, audit intent |
| Repository Layer | Data access abstraction - ORM/database access only |
| Django App | Modular unit representing a domain boundary |
| DTO | Plain data transfer structure (dict, dataclass, typed object) between layers |
| Serializer | Input/output validation structure - used ONLY in API/View Layer |

---

## 4. ARCHITECTURE FLOW (MANDATORY)

```text
Client Request
    ↓
API/View Layer
  - HTTP parsing, serializer validation
  - Permission class invocation (RBAC check)
  - Module Subscription Check (E04)
  - Service or Orchestrator call
  - Response formatting via ResponseBuilder (includes correlation_id)
    ↓
Orchestration Services (for multi-step cross-module workflows)
  - Coordinates calls to multiple bounded context services
  - Owns workflow state and compensation
  - Publishes domain event on completion
  - See E02 for full standards
    ↓
Service Layer (for single-module write operations)
  - Business logic and domain rules
  - Tenant validation from security_context
  - Transaction boundary management
  - Domain event publication via EventBus (→ Outbox)
  - Audit log intent
  - Returns DTO/plain data only
    ↓
Selector Layer (for read-only query operations, CQRS read side)
  - Read-optimized queries against primary DB or read replica
  - Returns typed DTOs/read models
  - No write operations
  - Governed by B25
    ↓
Repository Layer
  - ORM/database access only
  - Tenant-scoped query filtering
    ↓
Database (PostgreSQL)
  - Integrity constraints, indexes, migrations
  - Outbox table (event_outbox) read by background worker
```

---

## 5. CORE GOVERNANCE LAWS

### 5.1 Layer Enforcement (MANDATORY)

- All requests MUST follow: View → Service → Repository → Database
- Skipping layers is PROHIBITED
- Direct database access from View Layer is PROHIBITED
- Business logic in View Layer is PROHIBITED
- Repository access from View Layer is PROHIBITED

WHY THIS RULE EXISTS: Layer skipping destroys testability, creates security gaps (bypassing RBAC/tenant checks), and makes the codebase impossible to maintain at scale.

### 5.2 API/View Layer Rules (MANDATORY)

The View Layer MUST:
- Handle HTTP request parsing
- Invoke serializer validation for input shape, types, and formats
- Call appropriate permission classes (RBAC decorators/classes)
- Call Service Layer with explicit typed parameters
- Format and return response using the central ResponseBuilder

The View Layer MUST NOT:
- Contain business logic
- Access ORM, models, or repositories directly
- Open database transactions
- Import or use `security_context` construction logic
- Make authorization decisions beyond invoking permission classes

### 5.3 Service Layer Rules (MANDATORY)

The Service Layer MUST:
- Contain all business logic and domain orchestration
- Accept `security_context` as an explicit function parameter
- Validate tenant access from `security_context`
- Enforce RBAC beyond the permission decorator (for complex rules)
- Manage transaction boundaries
- Generate audit log entries for mutations
- Return DTO/plain data ONLY - never Django model objects
- Publish domain events via `EventBus.publish()` after successful mutations
- Publish events inside the same transaction using the Outbox Pattern (E01 §4.3)

The Service Layer MUST NOT:
- Access HTTP request/response objects
- Import or use DRF serializers
- Call `model.objects` or direct ORM queries
- Be the location for any HTTP or presentation logic
- Call another module's Service for async cross-domain operations - use domain events instead

The Service Layer MAY:
- Call another module's Service for synchronous reads where response is needed immediately

### 5.4 Repository Layer Rules (MANDATORY)

The Repository Layer MUST:
- Handle ALL ORM/database access
- Enforce query standards (B10)
- Apply tenant filtering on all tenant-owned queries (B02)
- Return models/querysets internally to services (services convert to DTO before returning to view)

The Repository Layer MUST NOT:
- Contain business logic
- Access HTTP, request, user, or `security_context` objects
- Call `transaction.atomic()` or manage transactions
- Make authorization decisions

### 5.5 DTO & Data Flow Contract (MANDATORY)

- DRF Serializers MUST ONLY be used in the API/View Layer
- Service Layer MUST ONLY accept and return: standard Python types, dataclasses, Pydantic models (DTOs), typed result objects
- Passing DRF Serializers into Service Layer is PROHIBITED
- Raw HTTP request objects MUST NOT be passed to Service Layer
- Database model instances MUST NOT be directly returned from Service Layer to View Layer

### 5.6 Django App Folder Structure (MANDATORY)

Each Django app MUST follow this structure:

```text
app_name/
├── models/
│   └── __init__.py
├── services/
│   └── __init__.py
├── selectors/                ← read-only query logic (CQRS read side, per B25)
│   └── __init__.py
├── orchestrators/         ← for multi-step cross-module workflows
│   └── __init__.py
├── repositories/         ← MUST use 'repositories/' (not 'repository/')
│   └── __init__.py
├── events/                ← domain event classes for this module
│   └── __init__.py
├── api/
│   ├── views/
│   │   └── __init__.py
│   ├── serializers/
│   │   └── __init__.py
│   └── urls.py
└── tests/
    └── __init__.py
```

Missing or incorrect structure is PROHIBITED.

### 5.7 Dependency Direction Rules (MANDATORY)

Allowed import direction:
```text
api/views → services → repositories → models
```

PROHIBITED import directions:
```text
api/views → repositories          (bypasses service layer)
api/views → models                (direct ORM access)
services  → api/views             (reverse dependency)
services  → serializers           (view concern in service)
services  → model.objects         (direct ORM - use repository)
repositories → services           (reverse dependency)
module A → module B internals     (cross-module coupling)
```

Circular dependencies are PROHIBITED. Shared logic MUST be moved to common modules.

### 5.8 Transaction Management (MANDATORY)

- Transactions MUST be handled ONLY in Service Layer (see B01 §5.16)
- Repository Layer MUST NOT call `transaction.atomic()`
- Views MUST NOT open transactions

### 5.9 Exception Handling (MANDATORY)

- Services MUST raise typed application exceptions
- Views MUST NOT contain broad business `try/except` logic
- The global exception handler maps exceptions to HTTP responses (see B01 §5.4)

### 5.10 Django Model & Signals Restrictions (MANDATORY)

- Business logic inside Django Models is PROHIBITED
- Overriding `.save()` or `.delete()` for business behavior is PROHIBITED
- Django Signals MUST NOT be used for domain business logic
- Signals MAY be used ONLY for: logging hooks, monitoring, non-critical side effects
- All business orchestration MUST occur in Service Layer

WHY THIS RULE EXISTS: Business logic in models creates hidden side effects, destroys testability, and makes tenant enforcement impossible to enforce centrally.

### 5.11 Background Task Architecture (MANDATORY)

- Async tasks MUST call Service Layer - business logic inside tasks is PROHIBITED
- Tasks MUST NOT access database directly
- Tasks MUST receive explicit plain data, IDs, and tenant context
- Tasks MUST NOT receive HTTP request objects
- See B01 §5.29 for full background job governance

### 5.12 API Layer Isolation (MANDATORY)

- API layer MUST be independent of internal model structure
- Changes in database MUST NOT break API contracts without versioning (see B01 §5.19)
- Serializers MUST represent the API contract, not the DB schema

---

### 5.13 Orchestration Service Rules (MANDATORY)

When a workflow crosses more than ONE bounded context (module) AND has more than 2 steps:
- An Orchestration Service MUST be created (see E02)
- The Orchestration Service MUST be placed between the API/View Layer and the Service Layer
- The Orchestration Service MUST publish a domain event on workflow completion
- The Orchestration Service MUST persist workflow state
- Compensation MUST be implemented for workflows with side effects

Orchestration Services MUST NOT:
- Access another module's repository or model directly
- Skip domain event publication on completion
- Execute business logic belonging to a specific module (delegate to that module's Service)


## 6. SECURITY & COMPLIANCE

### Architecture Security
- Layer violations are PROHIBITED (CRITICAL)
- Direct database access outside Repository Layer is PROHIBITED
- Business logic leakage outside Service Layer is PROHIBITED

### Authorization Placement
- RBAC permission checks MUST be invoked at the View Layer via permission classes
- Service Layer MAY perform additional authorization logic for complex scenarios
- Repository Layer MUST NOT make authorization decisions

### Data Protection
- Sensitive data MUST NOT be exposed across layers without appropriate filtering
- Internal models MUST NOT be directly returned in APIs
- Service Layer MUST convert models to DTOs before returning to View Layer

### Audit Logging
- The Service Layer MUST generate audit log entries for all mutations
- Audit logging is governed by B15 for implementation standards

---

## 7. NON-NEGOTIABLE RULES

- Layer skipping = CRITICAL violation
- Business logic in Views = PROHIBITED
- Direct DB access in Views = PROHIBITED
- Service returning Django models to View = PROHIBITED
- Repository calling `transaction.atomic()` = PROHIBITED
- Service importing DRF serializers = PROHIBITED
- Business logic in Django models or signals = PROHIBITED
- Background tasks accessing ORM directly = PROHIBITED
- Circular dependencies = PROHIBITED

---

## 8. VIOLATIONS & ENFORCEMENT

Non-compliant code MUST NOT be merged.

| Severity | Action |
|----------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 9. TESTING REQUIREMENTS

- All layers MUST be tested independently
- Service Layer MUST have unit tests (mock repositories)
- API Layer MUST have integration tests (test endpoints end-to-end)
- Repository Layer MUST have query tests (test ORM behavior, tenant filtering)
- Architecture compliance tests MUST verify no layer skipping
- Any failing test MUST block deployment

---

## 10. QUICK SUMMARY

- Strict layered architecture: View → Service → Repository → Database - no exceptions
- Business logic ONLY in Service Layer
- Database access ONLY in Repository Layer
- Services return DTOs/plain data - never Django model objects
- Django models and signals are for persistence only - no business logic
- Use `repositories/` folder naming (not `repository/`)

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.
