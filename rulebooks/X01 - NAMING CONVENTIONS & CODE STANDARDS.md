<!-- yss_orbit\rulebooks\X01 - NAMING CONVENTIONS & CODE STANDARDS.md -->
# X01 - NAMING CONVENTIONS & CODE STANDARDS

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Applies To:** ALL systems - backend, frontend, database, configuration
**Governance Role:** Cross-System Naming & Code Standards Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Naming conventions for all layers (backend, frontend, DB), code formatting standards, import standards, comment standards, magic number prohibition, constant naming |
| REFERENCES | B01 (canonical terminology - all naming must align), B08 (DB naming), F01 (frontend naming) |
| MUST NOT DUPLICATE | Canonical terminology (B01 §3), DB-specific naming (B08), frontend-specific structure (F01) |

---

## 1. PURPOSE

This rulebook defines **naming conventions and code standards** for all YSS Orbit code.

Consistent naming is mandatory for:
- Long-term maintainability
- Team-wide readability
- AI-assisted code review
- Anti-drift governance
- Onboarding new developers

ALL code across the platform MUST follow these standards.

---

## 2. SCOPE

Applies to: all backend code (Python/Django), all frontend code (TypeScript/React), all database objects (PostgreSQL), all configuration, all documentation. No file is exempt.

---

## 3. BACKEND NAMING STANDARDS (MANDATORY)

### 3.1 Python / Django

| Type | Convention | Example |
|------|-----------|---------| 
| Variables | `snake_case` | `business_unit_id`, `selected_bu` |
| Functions / Methods | `snake_case` | `get_employees()`, `validate_bu_access()` |
| Classes | `PascalCase` | `EmployeeService`, `InventoryRepository` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_PAGE_SIZE`, `DEFAULT_CACHE_TTL` |
| Modules / Files | `snake_case` | `employee_service.py`, `inventory_repository.py` |
| Django Apps | `snake_case` | `apps/employees/`, `apps/payroll/` |
| Repository Folder | `repositories/` | `apps/employees/repositories/` |
| Permission Codes | `{module}.{resource}.{action}` dot-notation | `inventory.stock.view`, `payroll.run.approve` |
| Audit Action Codes | `UPPER_SNAKE_CASE`, `MODULE_ACTION` | `EMPLOYEE_UPDATE`, `PAYROLL_DELETE` |
| URL Patterns | `kebab-case`, plural | `/api/v1/business-units/`, `/api/v1/employees/` |
| Error Codes | `UPPER_SNAKE_CASE` | `VALIDATION_ERROR`, `PERMISSION_DENIED` |

### 3.2 Prohibited Backend Naming

```text
camelCase for Python variables = PROHIBITED
PascalCase for functions = PROHIBITED
repository/ (singular) for repository folder = PROHIBITED - MUST use repositories/
int primary keys = PROHIBITED
tenant_id, bu_id, company_id = PROHIBITED - MUST use business_unit_id
business_unit_id abbreviated as bu_id in function parameters = PROHIBITED
errors (plural in response) = PROHIBITED - MUST use error (singular)
```

### 3.3 Orchestrator Naming Conventions (MANDATORY)

| Artifact | Convention | Example |
|---------|-----------|---------| 
| Orchestrator class | `PascalCase` + `Orchestrator` suffix | `PayrollOrchestrator`, `EmployeeLifecycleOrchestrator` |
| Orchestrator file | `snake_case_orchestrator.py` | `payroll_orchestrator.py` |
| Orchestrator folder | `orchestrators/` inside Django app | `apps/payroll/orchestrators/` |
| Orchestrator method (main) | verb + noun | `run()`, `onboard_employee()`, `transfer_stock()` |
| Compensation method | `_compensate_` + noun | `_compensate_onboarding()`, `_compensate_transfer()` |
| Workflow step marker | `SCREAMING_SNAKE_CASE` | `'HRMS_CREATED'`, `'PAYROLL_PROVISIONED'` |

### 3.4 Domain Event Naming Conventions (MANDATORY)

| Artifact | Convention | Example |
|---------|-----------|---------| 
| Event class | `PascalCase` + `Event` suffix | `AttendanceFinalizedEvent`, `PayrollGeneratedEvent` |
| Event type string | `aggregate.past_tense_verb` (dot notation, lowercase) | `attendance.finalized`, `payroll.generated` |
| Event file | `snake_case_event.py` | `attendance_finalized_event.py` |
| Event folder | `events/` inside Django app | `apps/attendance/events/` |
| Event payload field | `snake_case` | `employee_id`, `period_month`, `total_days` |
| Event version | `MAJOR.MINOR` semantic string | `"1.0"`, `"1.1"`, `"2.0"` |

**Event type string format (MANDATORY):**
```
{aggregate}.{past_tense_verb}

Valid:   attendance.finalized, payroll.generated, employee.terminated, invoice.paid
Invalid: AttendanceFinalized (PascalCase prohibited), attendance_finalized (underscore - use dot), finalize_attendance (verb first)
```

### 3.5 Outbox & Infrastructure Table Naming (MANDATORY)

| Table | Name | Notes |
|-------|------|-------|
| Event outbox | `event_outbox` | Never `outbox` alone |
| Dead-letter | `event_dead_letter` | Never `dead_letter` alone |
| Orchestrator state | `orchestrator_state` | One table for all orchestrators |
| Processed events | `processed_event` | Deduplication table |
| Domain (was sector) | `domain` | `sector` table PROHIBITED from v3.0 |

### 3.6 Feature Flag Naming Conventions (MANDATORY)

| Artifact | Convention | Example |
|---------|-----------|---------| 
| Feature flag code | `snake_case` | `advanced_payroll`, `biometric_attendance` |
| Feature flag DB column | `feature_code VARCHAR(100)` | - |
| Frontend flag check | `isEnabled('advanced_payroll')` | via `useFeatureFlags()` hook |
| Backend flag check | `FeatureService.is_enabled(business_unit_id, 'advanced_payroll')` | - |

Feature flag codes MUST be consistent between backend (`feature_flag.code`) and frontend (`useFeatureFlags()`) — they are the same string.

### 3.7 Cache Key Naming Conventions (MANDATORY)

All cache keys MUST follow this pattern: `{namespace}:{identifier}:{sub_identifier}`

| Cache Type | Key Pattern | Example |
|-----------|-------------|---------|
| Module subscription | `module_access:{business_unit_id}:{module_code}` | `module_access:uuid:PAYROLL` |
| Feature flag | `feature:{business_unit_id}:{feature_code}` | `feature:uuid:advanced_payroll` |
| Tenant settings | `settings:{business_unit_id}` | `settings:uuid` |
| Subscription plan | `subscription_plan:{business_unit_id}` | `subscription_plan:uuid` |
| RBAC permissions | `permissions:{user_id}:{business_unit_id}` | `permissions:uuid:uuid` |
| Security context | `security_context:{user_id}:{business_unit_id}` | `security_context:uuid:uuid` |

### 3.8 Prohibited Terminology Replacements (MANDATORY)

| Old (PROHIBITED) | New (REQUIRED) |
|-----------------|----------------|
| `sector_id` | `domain_id` |
| `sector_code` | `domain_code` |
| `SectorType` | `DomainType` |
| `SECTOR_RETAIL` | `DOMAIN_RETAIL` |
| `sector_filter` | `domain_filter` |
| `seed_sectors()` | `seed_domains()` |
| `tenantContext.sector` | `tenantContext.domain` |

Any occurrence of "sector" in Python, TypeScript, SQL, migrations, or documentation MUST be replaced with "domain" equivalents. CI pipeline MUST enforce this with a linting check.

---

## 4. FRONTEND NAMING STANDARDS (MANDATORY)

### 4.1 TypeScript / React

| Type | Convention | Example |
|------|-----------|---------| 
| Variables | `camelCase` | `businessUnitId`, `selectedEmployee` |
| Functions | `camelCase` | `getEmployees()`, `handleSubmit()` |
| Components | `PascalCase` | `EmployeeCard`, `PayrollTable` |
| Hooks | `camelCase`, prefix `use` | `useEmployeeList()`, `useAuthState()` |
| Types / Interfaces | `PascalCase` | `Employee`, `ApiResponse<T>` |
| Enums | `PascalCase` | `DataScope`, `AuthStatus` |
| Enum Values | `UPPER_SNAKE_CASE` | `DataScope.BUSINESS_UNIT` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_PAGE_SIZE`, `DEFAULT_TIMEOUT` |
| Files - Components | `PascalCase.tsx` | `EmployeeCard.tsx`, `PayrollTable.tsx` |
| Files - Hooks | `camelCase.ts` | `useEmployeeList.ts` |
| Files - Utils | `camelCase.ts` | `formatCurrency.ts` |
| Files - Types | `camelCase.types.ts` | `employee.types.ts` |
| Routes (URLs) | `kebab-case` | `/employees`, `/payroll-reports` |
| CSS Classes | Tailwind utility classes (no BEM) | `text-primary`, `mt-4` |
| Test Files | Same name + `.test.tsx` | `EmployeeCard.test.tsx` |
| Permission Constants | `{module}.{resource}.{action}` dot-notation strings | `'inventory.stock.view'`, `'payroll.run.approve'` |
| Context Providers | `PascalCase` + `Provider` suffix | `TenantContextProvider`, `AuthContextProvider` |
| Constants files | `camelCase.ts` | `permissions.ts`, `errorCodes.ts` |

### 4.2 Prohibited Frontend Naming

```text
snake_case for TypeScript variables = PROHIBITED
Generic component names (Component, Item, Box) = PROHIBITED
any type without explicit review = PROHIBITED
Inline permission strings without PERMISSIONS constant = PROHIBITED
```

---

## 5. DATABASE NAMING STANDARDS (MANDATORY)

| Type | Convention | Example |
|------|-----------|---------| 
| Table names | `snake_case`, plural | `employees`, `business_units`, `audit_logs` |
| Column names | `snake_case` | `business_unit_id`, `created_at`, `is_deleted` |
| Tenant column | ALWAYS `business_unit_id` | Alternatives PROHIBITED |
| Primary key | `id` (UUID) | `id UUID PRIMARY KEY` |
| Foreign keys | `{table_singular}_id` | `employee_id`, `role_id` |
| Indexes | `idx_{table}_{columns}` | `idx_employees_bu`, `idx_inventory_bu_code` |
| Unique indexes | `uidx_{table}_{columns}` | `uidx_employees_bu_email` |
| Check constraints | `chk_{table}_{column}` | `chk_employees_status` |

---

## 6. CONFIGURATION NAMING STANDARDS (MANDATORY)

| Type | Convention | Example |
|------|-----------|---------| 
| Environment variables | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `SECRET_KEY` |
| Django settings | `UPPER_SNAKE_CASE` | `MAX_PAGE_SIZE`, `CACHE_TTL_PERMISSIONS` |
| Feature flags | `UPPER_SNAKE_CASE`, prefix `FEATURE_` | `FEATURE_NEW_DASHBOARD` |

---

## 7. GENERAL CODE STANDARDS (MANDATORY)

### 7.1 Magic Numbers (MANDATORY)

Magic numbers in business logic are PROHIBITED. All numeric constants MUST be named:

```python
# PROHIBITED:
cache.set(key, data, timeout=300)
queryset[:25]

# REQUIRED:
PERMISSIONS_CACHE_TTL = 300          # seconds
MAX_PAGE_SIZE = 25
cache.set(key, data, timeout=PERMISSIONS_CACHE_TTL)
queryset[:MAX_PAGE_SIZE]
```

### 7.2 Comments (MANDATORY)

- Code MUST be self-documenting through clear naming
- Comments MUST explain WHY - not WHAT (the code shows what)
- Commented-out dead code is PROHIBITED in production
- TODO comments MUST include a ticket reference: `# TODO(PROJ-123): ...`

```python
# PROHIBITED:
# Get the employee
employee = repo.get(id)

# REQUIRED:
# Validate tenant ownership BEFORE loading - prevents cross-tenant access via direct URL
employee = repo.get_by_id_and_bu(id, security_context.selected_business_unit_id)
```

### 7.3 Code Formatting (MANDATORY)

| Layer | Formatter |
|-------|----------|
| Python | `black` (line length 100) |
| TypeScript | `prettier` |
| SQL | `pgFormatter` or consistent manual formatting |

Formatting MUST be enforced in CI/CD (format check must pass). Inconsistent formatting blocks merge.

### 7.4 Import Standards (MANDATORY)

Python imports MUST be organized:
1. Standard library
2. Third-party packages
3. Internal application imports

```python
# REQUIRED order:
import os
import uuid
from datetime import datetime

from django.db import models
from rest_framework import serializers

from apps.common.exceptions import ValidationError
from apps.employees.repositories import EmployeeRepository
```

TypeScript imports MUST be organized:
1. External packages
2. Internal absolute imports (`@/...`)
3. Relative imports

### 7.5 Function Length (MANDATORY)

- Functions MUST NOT exceed 50 lines
- Functions exceeding 50 lines MUST be refactored into smaller units
- Single-responsibility principle MUST be applied

### 7.6 No Dead Code (MANDATORY)

- Unused imports are PROHIBITED
- Unused variables are PROHIBITED
- Commented-out dead code blocks are PROHIBITED
- These MUST be caught by linting rules in CI/CD

---

## 8. ANTI-DRIFT PROTECTION (MANDATORY)

The following naming drift patterns are PROHIBITED and MUST be caught at PR review:

```text
Using 'tenant_id' instead of 'business_unit_id' = PROHIBITED
Using 'repository/' instead of 'repositories/' = PROHIBITED
Using 'errors' instead of 'error' in API responses = PROHIBITED
Using integer PKs instead of UUIDs = PROHIBITED
Using role names instead of permission codes = PROHIBITED
Using display names in business logic = PROHIBITED
Mixing camelCase in Python = PROHIBITED
Mixing snake_case in TypeScript = PROHIBITED
Using 'sector' terminology anywhere = PROHIBITED (must be 'domain')
Using 'bu_id' abbreviation instead of 'business_unit_id' = PROHIBITED
```

---

## 9. NON-NEGOTIABLE RULES

- Any canonical naming drift = PROHIBITED
- Magic numbers in business logic = PROHIBITED
- Commented-out dead code = PROHIBITED
- Formatting failures in CI/CD = block merge
- Unused imports or variables = PROHIBITED
- `repository/` folder name = PROHIBITED (must be `repositories/`)
- Alternative tenant column names = PROHIBITED
- `sector` terminology = PROHIBITED (must be `domain`)

---

## 10. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 11. QUICK SUMMARY

- Backend: `snake_case` variables, `PascalCase` classes, `UPPER_SNAKE_CASE` constants; permission codes use dot-notation `{module}.{resource}.{action}`
- Frontend: `camelCase` variables, `PascalCase` components; permission strings use dot-notation
- Database: `snake_case` tables and columns, `business_unit_id` ONLY for tenant column
- Terminology: `domain` ONLY — `sector` is PROHIBITED
- No magic numbers - all constants named
- No dead code - linting enforces this in CI/CD

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.
