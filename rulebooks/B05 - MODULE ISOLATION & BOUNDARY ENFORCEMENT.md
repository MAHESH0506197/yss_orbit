<!-- yss_orbit\rulebooks\B05 - MODULE ISOLATION & BOUNDARY ENFORCEMENT.md -->
# B05 - MODULE ISOLATION & BOUNDARY ENFORCEMENT

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01 (System Foundation), B03 (Domain Model), B04 (Application Architecture)
**Governance Role:** Module Boundary Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Module independence rules, public interface enforcement, cross-module import restrictions, soft UUID reference pattern, URL routing isolation, event-based communication governance |
| REFERENCES | B01 (dependency direction), B03 (domain boundaries), B04 (layer architecture) |
| MUST NOT DUPLICATE | Layer architecture rules (B04), DB FK rules (B08), tenant isolation (B02) |

---

## 1. PURPOSE

This rulebook defines **strict module isolation rules** for YSS Orbit.

It establishes:
- Boundaries between modules
- Dependency control between Django apps
- Prevention of tight coupling
- Enforced modular architecture for future scalability

All modules MUST remain independent and well-defined.

---

## 2. SCOPE

Applies to: all Django apps (modules), all backend code organization, all cross-module interactions, all imports and dependencies. No module is exempt.

---

## 3. DEFINITIONS

| Term | Definition |
|------|-----------|
| Module | A Django app representing a domain boundary |
| Public Interface | Exposed service layer API of a module - the ONLY allowed cross-module entry point |
| Internal Logic | Private implementation within a module - not accessible from outside |
| Soft UUID Reference | Storing another module's entity UUID as a plain UUIDField (no DB-level FK) |
| Boundary Violation | Any direct access to another module's internal models, repositories, or services bypassing the public interface |

---

## 4. MODULE ARCHITECTURE PRINCIPLES

### Why Module Isolation Matters

Strong module isolation is REQUIRED to:
- Enable independent deployment of modules in future microservice evolution
- Prevent cascade failures across unrelated domains
- Enable independent testing per domain
- Prevent accidental cross-module tenant leakage
- Support future plugin/extension architecture

---

## 5. CORE GOVERNANCE LAWS

### 5.1 Module Independence (MANDATORY)

Each module is a **Bounded Context**. This means:
- Each module owns its own data models, repositories, and business language
- Data that crosses module boundaries MUST be translated at the boundary (Anti-Corruption Layer)
- No module EVER has a database-level foreign key into another module's tables
- No module EVER imports from another module's `models/` or `repositories/`
- Modules MUST NOT access internal code of other modules
- Direct cross-module internal access is PROHIBITED

WHY BOUNDED CONTEXTS MATTER: Each module can be independently tested, deployed, and eventually extracted into a separate service. Without bounded context boundaries, what appears as "just a shared model" today becomes a deployment blocker when you try to scale specific modules independently.

### 5.2 Public Interface Enforcement (MANDATORY)

Each module MUST expose a clear public interface through its Service Layer.

Other modules MUST interact ONLY through:
- The owning module's service methods
- Defined internal APIs

Accessing another module's models, repositories, or internal services directly is PROHIBITED.

### 5.3 Import Restrictions (MANDATORY)

Cross-module imports MUST follow:
- Module A MAY import Module B ONLY via its public service interface

PROHIBITED import patterns:
```python
# PROHIBITED - accessing another module's model directly
from apps.payroll.models import PayrollRecord

# PROHIBITED - accessing another module's repository
from apps.payroll.repositories import PayrollRepository

# PROHIBITED - wildcard cross-module import
from apps.payroll import *

# REQUIRED - access via public service interface only
from apps.payroll.services import PayrollService
result = PayrollService.get_payroll_summary(employee_id, security_context)
```

### 5.4 Cross-Module Foreign Key Restriction (MANDATORY)

Physical database-level relationships across module boundaries are PROHIBITED.

PROHIBITED across module boundaries:
```python
# PROHIBITED - physical FK across modules
employee = models.ForeignKey('users.User', on_delete=models.CASCADE)
payroll_record = models.ForeignKey('payroll.PayrollRecord', on_delete=models.PROTECT)
```

REQUIRED - use soft UUID references:
```python
# REQUIRED - soft UUID reference
employee_id = models.UUIDField()  # No DB-level FK constraint
```

Validation of the referenced entity MUST occur at Service Layer via the target module's service call.

**Violation:** DB-level FK across module boundaries = CRITICAL architecture violation.

### 5.5 Dependency Direction (MANDATORY)

- Dependencies MUST flow in a controlled, acyclic direction
- Circular dependencies are PROHIBITED
- Bidirectional dependencies are PROHIBITED

A dependency map MUST be maintained and reviewed at Architecture Review.

### 5.6 Shared Modules (MANDATORY)

- Common logic MUST be placed in shared modules (e.g., `apps/common/`)
- Shared modules MUST NOT contain domain-specific logic
- Shared modules MUST be reusable across all modules
- Domains MUST NOT own logic that belongs in shared modules

### 5.7 Data Access Isolation (MANDATORY)

- Modules MUST NOT directly access another module's database tables
- All cross-module data access MUST go through the owning module's service layer
- Direct ORM queries against another module's models are PROHIBITED

### 5.8 Event-Based Communication (MANDATORY - Governed by E01)

Async cross-module communication MUST use domain events via the Outbox Pattern.
Direct async cross-module service calls are PROHIBITED.

Rules:
- Module A wanting to react to Module B's operation → subscribe to Module B's domain event
- Module B publishes events when its aggregate state changes (see E01 §4.8 catalogue)
- Event payloads MUST NOT expose Module B's internal model structure
- Event consumers MUST enforce tenant isolation independently
- Event consumers MUST be idempotent

Synchronous reads:
- Module A MAY call Module B's public service interface for a synchronous read
- Synchronous reads MUST NOT be used to mutate data in Module B
- Synchronous reads MUST use Module B's documented public service method

Reference E01 for full event standards.
Reference E02 for orchestration of multi-step cross-module workflows.

### 5.9 URL Routing Isolation (MANDATORY)

- Each module MUST define its own `urls.py`
- Each module MUST manage its own API routing
- The global router MUST ONLY use `include()`:

```python
# REQUIRED:
path("api/v1/users/", include("apps.users.api.urls"))
path("api/v1/payroll/", include("apps.payroll.api.urls"))
```

PROHIBITED:
- Defining module routes directly in project-level `urls.py`
- Cross-registering routes from one module into another
- Mixing endpoints of multiple modules in a single router file

**Violation:** Routing isolation violation = CRITICAL architecture violation.

### 5.10 Testing Isolation (MANDATORY)

- Modules MUST be testable independently
- Tests MUST NOT depend on internal behavior of other modules
- Cross-module tests MUST use the public service interface
- Test fixtures MUST not create cross-module DB-level dependencies

### 5.11 Future Microservice Readiness (MANDATORY)

Module boundaries MUST be designed as if each module could become an independent service.

This means:
- Module data MUST be self-contained where possible
- Cross-module calls MUST be designed as explicit, well-documented service contracts
- Module-internal cache keys MUST be namespaced per module
- Each module MUST own its own audit logging for its domain

---

### 5.12 Bounded Context Map (MANDATORY)

Every module MUST maintain a Context Map documenting:

```python
# Example Context Map for Payroll module:
PAYROLL_CONTEXT_MAP = {
    "subscribes_to": [
        "attendance.finalized",      # E01 catalogue
        "employee.updated",
        "employee.terminated",
    ],
    "publishes": [
        "payroll.generated",
        "payroll.approved",
    ],
    "reads_from": [
        # Synchronous reads via public service interfaces:
        "AttendanceService.get_summary",    # Read attendance summary
    ],
    "soft_references": [
        "employee_id",      # UUID reference to HRMS.Employee - no FK
        "department_id",    # UUID reference to HRMS.Department - no FK
    ],
}
```

This map MUST be reviewed at Architecture Review for any new cross-module dependency.


## 6. SECURITY & COMPLIANCE

### Boundary Security
- Module boundaries MUST be strictly enforced
- Unauthorized cross-module access is PROHIBITED
- Boundary violations are CRITICAL security risks that bypass tenant isolation

### Cross-Module Operations
- Cross-module operations affecting security, tenant scope, or business data MUST be auditable
- RBAC MUST be enforced before cross-module operations (B07)

---

## 7. NON-NEGOTIABLE RULES

- Accessing another module's internal code = PROHIBITED
- Direct DB access across modules = PROHIBITED
- Physical FK across module boundaries = CRITICAL violation
- Circular dependency = CRITICAL violation
- Wildcard cross-module imports = PROHIBITED
- Event payloads exposing internal model structures = PROHIBITED
- Direct async cross-module service calls = PROHIBITED (use domain events via E01)
- Missing Bounded Context Map = PROHIBITED
- Cross-module routing violations = CRITICAL violation

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

- Modules MUST be tested independently
- Cross-module interactions MUST be tested via public service interfaces
- Boundary violations MUST be detected in architecture tests
- Event-based communication MUST be tested for tenant safety
- URL isolation MUST be validated in routing tests
- Any failing test MUST block deployment

---

## 10. QUICK SUMMARY

- Modules MUST be independent - communicate only via public service interfaces
- No physical FKs across module boundaries - use soft UUID references
- No direct DB access to another module's tables
- Events MUST be tenant-safe
- Routing MUST be module-isolated
- Design for future microservice extraction

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.
