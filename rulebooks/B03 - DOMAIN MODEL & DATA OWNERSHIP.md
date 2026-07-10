<!-- yss_orbit\rulebooks\B03 - DOMAIN MODEL & DATA OWNERSHIP.md -->
# B03 - DOMAIN MODEL & DATA OWNERSHIP

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01 (System Foundation), B02 (Multi-Tenant Architecture)
**Governance Role:** Domain Modeling Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Entity design standards, data ownership classification, entity relationship rules, lifecycle ownership, aggregate boundary governance, model design standards |
| REFERENCES | B01 (canonical terms, soft delete), B02 (tenant isolation, business_unit_id), B08 (DB schema standards) |
| MUST NOT DUPLICATE | Tenant isolation enforcement (B02), DB migration rules (B08), security context (B01) |

---

## 1. PURPOSE

This rulebook defines **domain modeling standards and data ownership rules** for YSS Orbit.

It establishes:
- Entity design standards
- Data ownership classification
- Relationships between entities
- Lifecycle ownership of data
- Aggregate boundary governance

All domain models MUST comply with these rules.

---

## 2. SCOPE

Applies to: all database models (Django ORM), all domain entities across modules, all relationships (foreign keys, many-to-many), all data ownership definitions, all lifecycle operations (create, update, delete). No model or entity is exempt.

---

## 3. DEFINITIONS

All canonical terms from B01 §3 apply. Additional domain terms:

| Term | Definition |
|------|-----------|
| Entity | A domain object represented as a database model |
| Domain Model | Structured representation of business data |
| Aggregate | Group of entities treated as a single consistency unit |
| Aggregate Root | The entry-point entity controlling access to an aggregate |
| Child Entity | Entity dependent on a parent within an aggregate |
| Reference Data | Shared read-only data used across tenants (Platform Data) |
| Lifecycle | Creation → Update → Deletion flow of an entity |
| Business Domain | A Classification Entity (e.g. Retail, Pharmacy). It is NOT a tenant boundary. |

---

## 4. ENTITY OWNERSHIP CLASSIFICATION (MANDATORY)

Every entity MUST be explicitly classified as ONE of:

| Class | `business_unit_id`? | Access | Example |
|-------|-------------------|----|--------|
| **Tenant-Owned** | REQUIRED (NOT NULL) | Scoped per BusinessUnit | Employee, Payroll, Attendance, Inventory, Leave |
| **Platform/Global** | MUST NOT include | System-wide | Organization, Domain, Role, Permission, SystemConfig |
| **Reference Data** | MUST NOT include | Read-only for tenants | Tax categories, standard codes |

Rules:
- Ownership type MUST be defined at model level (via docstring or class attribute)
- Ambiguous ownership is PROHIBITED
- Ownership classification MUST occur before schema design begins

WHY THIS RULE EXISTS: Ownership drives whether `business_unit_id` is required, whether tenant filters apply, and whether RBAC scoping is needed. Ambiguous classification leads to tenant leakage or over-isolation.

---

## 5. CORE GOVERNANCE LAWS

### 5.1 Tenant-Owned Entity Rules (MANDATORY)

Tenant-owned entities MUST:
- Include `business_unit_id` (NOT NULL)
- Follow all B02 tenant isolation rules
- NEVER exist without a valid `business_unit_id` reference
- Have `business_unit_id` assigned from `security_context` at creation time - NEVER from client payload

### 5.2 Platform/Global Entity Rules (MANDATORY)

Platform/global entities MUST:
- NOT include `business_unit_id` as an ownership field
- Be accessible across all tenants (with appropriate RBAC)
- Be read-only for tenants unless system/admin-controlled
- Not apply tenant filtering in repository queries

### 5.3 Aggregate Boundary Governance (MANDATORY)

Aggregates define consistency boundaries for related entities.

Rules:
- Aggregates MUST define clear consistency boundaries
- All updates within an aggregate MUST be transactional
- Partial updates across aggregate boundaries are PROHIBITED
- Repositories MUST operate ONLY on Aggregate Roots
- Direct database operations on Child Entities (bypassing the Aggregate Root) are PROHIBITED
- All modifications to child entities MUST occur through the Aggregate Root

WHY THIS RULE EXISTS: Bypassing aggregate roots leads to inconsistent state and broken invariants that are extremely difficult to debug in production.

### 5.4 Relationship Ownership Rules (MANDATORY)

- Parent and child entities MUST share ownership type
- Tenant-owned entities MUST relate only to other tenant-owned entities within the same BusinessUnit
- Cross-tenant foreign key relationships are PROHIBITED (see B02 §5.15)
- Cross-module physical foreign keys are PROHIBITED (see B01 §5.20) - use soft UUID references

### 5.5 Lifecycle Ownership (MANDATORY)

- Ownership MUST be assigned at creation time from `security_context`
- Ownership MUST NOT change after creation
- `business_unit_id` is immutable after record creation
- Reassigning entity ownership to a different BusinessUnit is PROHIBITED

WHY THIS RULE EXISTS: Mutable ownership creates data integrity violations and audit gaps.

### 5.6 Creation Rules (MANDATORY)

- Entity creation MUST validate ownership before writing
- Tenant-owned entities MUST use `security_context.selected_business_unit_id` for `business_unit_id` assignment
- Client-provided ownership values MUST be ignored
- `business_unit_id` MUST be validated to exist in `security_context.allowed_business_unit_ids`

### 5.7 Update Rules (MANDATORY)

- Updates MUST NOT change `business_unit_id`
- Updates MUST enforce tenant scope before execution
- Ownership fields are immutable

### 5.8 Deletion Rules (MANDATORY)

- Soft delete MUST follow B01 §5.5 rules
- Physical deletion of business data is PROHIBITED
- Deletion MUST respect ownership - cross-tenant deletion is PROHIBITED
- Soft delete MUST preserve the `business_unit_id` field value

### 5.9 Data Integrity Rules (MANDATORY)

- Entity relationships MUST maintain referential consistency
- Orphan records are PROHIBITED
- Invalid foreign key references MUST NOT be created
- Multi-entity write operations MUST be wrapped in a Service Layer transaction (B01 §5.16)

### 5.10 Model Design Standards (MANDATORY)

All entities MUST include:

```python
id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
created_at = models.DateTimeField(auto_now_add=True)   # UTC
updated_at = models.DateTimeField(auto_now=True)        # UTC
```

Additional required fields per B01 §5.5:

```python
is_active     = models.BooleanField(default=True)
is_deleted    = models.BooleanField(default=False)
created_by_id = models.UUIDField(null=True, blank=True)
updated_by_id = models.UUIDField(null=True, blank=True)
```

Rules:
- Models MUST be normalized
- Integer-based primary keys are PROHIBITED
- Redundant data storage is PROHIBITED unless explicitly justified and documented
- UUID primary keys MUST be system-generated - NEVER client-provided

### 5.11 Identifier Usage (MANDATORY)

Per B01 §5.12:
- `id` (UUID) → Database relationships only
- `*_code` → Business logic, permissions, decisions
- `name` / `*_name` → UI display labels ONLY

Using display names in business logic is PROHIBITED.

---

## 6. SECURITY & COMPLIANCE

### Ownership Enforcement
- Data access MUST respect ownership rules defined in §5
- Access to tenant-owned entities MUST follow B02 tenant scope rules
- Unauthorized ownership access is a CRITICAL violation

### Audit Logging
All entity lifecycle events MUST be logged (implementation governed by B15):
- CREATE: `old_values = null`, `new_values = created state`
- UPDATE: `old_values = state before`, `new_values = state after`
- DELETE (soft): `old_values = active state`, `new_values = deleted state`

Logs MUST include: `user_id`, `entity_id`, `business_unit_id` (if applicable), `trace_id`, `correlation_id`

### Access Control
- RBAC MUST be enforced before ownership validation (B07)
- Authorization order: Authentication → RBAC → Tenant Scope → Ownership Validation

---

## 7. NON-NEGOTIABLE RULES

- Undefined ownership = PROHIBITED
- Cross-tenant relationships = PROHIBITED
- Ownership mutation after creation = PROHIBITED
- Orphan records = PROHIBITED
- Skipping ownership validation = CRITICAL violation
- Integer primary keys = PROHIBITED
- Client-provided `business_unit_id` on create = PROHIBITED (assign from security_context)
- Physical delete of business data = PROHIBITED
- Direct child entity DB operations bypassing Aggregate Root = PROHIBITED

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

- All entities MUST be tested for ownership correctness
- Relationship tests MUST validate ownership alignment
- Creation tests MUST validate `business_unit_id` assignment from `security_context`
- Update tests MUST ensure `business_unit_id` immutability
- Deletion tests MUST validate soft delete rules
- Cross-tenant relationship creation MUST be rejected in tests
- Any failing test MUST block deployment

---

## 10. QUICK SUMMARY

- Every entity MUST have explicit ownership classification before schema design
- Ownership MUST be assigned from `security_context` - never from client payload
- Ownership MUST NEVER change after creation
- Cross-tenant relationships are PROHIBITED
- Aggregates define consistency boundaries - bypass is PROHIBITED

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.
