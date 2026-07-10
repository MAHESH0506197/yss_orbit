<!-- yss_orbit\rulebooks\B02 - MULTI-TENANT ARCHITECTURE.md -->
# B02 - MULTI-TENANT ARCHITECTURE

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01 (System Foundation - highest authority)
**Governance Role:** Multi-Tenant Isolation Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Tenant isolation model, data ownership boundaries, cross-tenant protection, tenant-safe caching keys, tenant-aware unique constraints, tenant-aware FK enforcement, GLOBAL scope data access pattern, NO_SCOPE governance, bulk operation tenant safety, background job tenant isolation, signed URL tenant validation |
| REFERENCES | B01 (security_context, canonical terms), B07 (RBAC - enforced before tenant check), B08 (DB schema), B15 (audit logging) |
| MUST NOT DUPLICATE | security_context definition (B01), RBAC specifics (B07), DB migration rules (B08), audit log format (B15) |

---

## 1. PURPOSE

This rulebook defines the **mandatory multi-tenant architecture** of YSS Orbit.

It establishes:

- Tenant isolation model
- Data ownership boundaries
- Access control scope
- Cross-tenant protection rules

All tenant-related operations MUST follow this rulebook.

---

## 2. SCOPE

This rulebook applies to:

- All database tables containing tenant-owned data
- All API endpoints accessing tenant data
- All service and repository logic
- All queries, filters, and data operations
- All background jobs and async processing
- All caching operations
- All file access and storage operations

No data access operation is exempt.

---

## 3. DEFINITIONS

All terms use canonical definitions from B01 §3. The following are restated for clarity:

| Term | Definition |
|------|-----------|
| **Organization** | Customer Grouping Entity. Represents the parent company owning one or more BusinessUnits. |
| **BusinessUnit** | Operational Tenant Boundary - the REAL isolation unit for business logic. |
| **`business_unit_id`** | Ownership column on tenant-owned data records |
| **`selected_business_unit_id`** | Active BusinessUnit for the current request |
| **`allowed_business_unit_ids`** | Backend-derived frozenset of all BUs the user may access |
| **`data_scope`** | RBAC access breadth: `BUSINESS_UNIT` or `GLOBAL` |
| **Tenant-Owned Data** | Data linked to a specific `business_unit_id` |
| **Platform/Global Data** | System-level data not tied to any tenant |
| **Cross-Tenant Access** | Accessing data belonging to another BusinessUnit |
| **NO_SCOPE** | Controlled bypass for system-level operations ONLY |

---

## 4. CRITICAL FIELD DISTINCTION

These four concepts MUST NEVER be confused:

| Field | Meaning | Wrong usage |
|-------|---------|------------|
| `business_unit_id` | DATA OWNERSHIP - the tenant that owns a data record | Using as access filter without `allowed_business_unit_ids` check |
| `selected_business_unit_id` | REQUEST CONTEXT - which BU this specific request targets | Trusting from client input without validation |
| `allowed_business_unit_ids` | ACCESS LIST - backend-derived, all BUs the user can access | Storing in session, cache, or client-side |
| `data_scope` | ACCESS BREADTH - `BUSINESS_UNIT` or `GLOBAL` | Using as bypass instead of RBAC + tenant check |

`data_scope = "GLOBAL"` is NOT the same as `business_unit_id = NULL`.
`data_scope` controls access breadth. `business_unit_id` controls data ownership.

---

## 5. CORE GOVERNANCE LAWS

### 5.1 Data Classification (MANDATORY - Before Schema Design)

Every table MUST be explicitly classified before any design or coding begins:

| Class | `business_unit_id`? | Example |
|-------|-------------------|----|
| Tenant-Owned | REQUIRED (NOT NULL) | Inventory, Orders, Employees, Payroll, Attendance |
| Platform/Global | MUST NOT include | Roles, Permissions, Domains, Organizations |
| Audit/Security | Only if tenant-scoped event | AuditLog (may include BU scope) |

A developer MUST NOT assume "all tables need `business_unit_id`". Classification is explicit and mandatory.

### 5.2 Tenant Column Requirement (MANDATORY)

- All tenant-owned tables MUST include `business_unit_id` (NOT NULL)
- Tables missing the tenant column for tenant-owned data are PROHIBITED
- Global/system tables MUST NOT include `business_unit_id` as an ownership field
- `business_unit_id` is the ONLY allowed tenant ownership column name

PROHIBITED alternative names:
```text
tenant_id  bu_id  company_id  branch_id  shop_id  store_id  outlet_id
```

### 5.3 Query Scope Enforcement - Two Independent Layers (MANDATORY)

Tenant isolation MUST be enforced at TWO independent layers. Service validation alone is NOT sufficient. Repository scope alone is NOT sufficient. BOTH are REQUIRED.

**Level 1 - Service Layer (access validation):**

```python
def validate_business_unit_access(selected_bu_id, security_context):
    if security_context.data_scope == "GLOBAL":
        return  # GLOBAL scope - RBAC has already passed
    if selected_bu_id not in security_context.allowed_business_unit_ids:
        raise PermissionDenied("Access denied to this BusinessUnit")
```

**Level 2 - Repository Layer (query filtering):**

```python
# REQUIRED: All tenant-owned queries MUST include tenant filter
def fetch_items(self, business_unit_id):
    return Item.objects.filter(
        business_unit_id=business_unit_id,
        is_deleted=False,
        is_active=True,
    )
```

**Violation:** Missing tenant filter = CRITICAL tenant leak.

### 5.4 Object-Level Fetch Enforcement (MANDATORY)

Fetching a tenant-owned record by primary key ALONE is PROHIBITED.

```python
# PROHIBITED:
Item.objects.get(id=item_id)                     # No tenant scope
Item.objects.filter(id__in=[id1, id2])           # No tenant scope

# REQUIRED:
Item.objects.get(
    id=item_id,
    business_unit_id=selected_business_unit_id,
    is_deleted=False,
    is_active=True,
)
```

**Violation:** Object fetch without tenant scope = CRITICAL security breach.

### 5.5 Cross-Tenant Inference Prevention (MANDATORY)

When access is denied to a tenant-owned record:
- MUST return 403 OR safe 404 per endpoint contract
- MUST NOT reveal whether the record exists in another tenant (no timing differences, no enumerable IDs)
- MUST log a `SECURITY_VIOLATION` event including `user_id`, `resource_id`, `attempted_business_unit_id`

### 5.6 Security Context as Source of Tenant Truth (MANDATORY)

- Tenant scope MUST be derived ONLY from `security_context` (backend-generated)
- Client-provided `business_unit_id` MUST NOT be trusted directly
- Client input MUST be validated against `security_context["allowed_business_unit_ids"]`
- `allowed_business_unit_ids` MUST be backend-derived from authenticated user + active UserBusinessUnit memberships + RBAC-approved tenant access
- Direct tenant grants outside UserBusinessUnit membership mapping are PROHIBITED

```python
# PROHIBITED:
business_unit_id = request.data["business_unit_id"]
return repo.fetch(business_unit_id)  # Trusting client input directly

# REQUIRED:
selected_bu_id = request.data["business_unit_id"]
service.validate_bu_access(selected_bu_id, security_context)
return repo.fetch(selected_bu_id)
```

### 5.7 Organization Consistency Enforcement (MANDATORY)

Every BusinessUnit MUST belong to exactly one Organization. Cross-organization tenant linkage is PROHIBITED.

- BusinessUnit.organization_id MUST be immutable after creation unless an approved migration workflow exists
- UserBusinessUnit membership MUST respect organization ownership
- Cross-organization reporting MUST require explicit RBAC authorization
- Organization aggregation queries MUST validate BusinessUnit ownership consistency

**Violation:** Cross-organization tenant linkage = CRITICAL architecture violation.

### 5.8 Write Operations (MANDATORY)

- All create operations MUST assign `business_unit_id` from `security_context`
- Payload-provided tenant values MUST be ignored for ownership assignment
- Cross-tenant write operations are PROHIBITED

### 5.9 Update & Delete Operations (MANDATORY)

- Update/Delete MUST enforce tenant scope BEFORE execution
- Operations affecting records outside the user's allowed BusinessUnits are PROHIBITED
- Soft delete MUST respect tenant boundaries
- Soft-deleted records MUST remain tenant-scoped
- Cross-tenant restore operations are PROHIBITED
- Soft-delete queries MUST preserve tenant filtering

### 5.10 NO_SCOPE Usage (STRICTLY CONTROLLED)

Bypassing tenant filtering is allowed ONLY for:

| Allowed Use Case | Why |
|-----------------|-----|
| Login - user lookup | No tenant context exists yet |
| Permission loading | System-level operation |
| Menu/navigation loading | System-level operation |
| GLOBAL-scope operations after RBAC passes | Explicit admin operation |
| System initialization / migrations | No user context |

NO_SCOPE usage MUST:
- Be explicit and documented in code
- Be logged with reason
- NEVER be used for normal user-facing tenant-owned data queries

```python
# PROHIBITED:
items = repo.fetch_all(no_scope=True)  # For tenant-owned data - FORBIDDEN
```

### 5.11 Bulk Operations (MANDATORY)

- Bulk operations MUST enforce tenant filtering
- Mixed-tenant bulk operations are PROHIBITED
- Each record in a bulk operation MUST be validated against tenant scope
- Bulk operations MUST execute atomically per tenant boundary
- Partial cross-tenant execution is PROHIBITED

### 5.12 Background Jobs / Async Tasks (MANDATORY)

- Tenant context MUST be passed explicitly to all background jobs
- Jobs MUST enforce tenant isolation
- Running jobs without tenant context is PROHIBITED
- Jobs MUST NOT receive HTTP request objects - only plain data and IDs
- Retry jobs MUST preserve original tenant scope
- Scheduled jobs MUST NOT execute unscoped tenant queries
- Background job retries MUST NOT expand tenant access beyond original scope

### 5.13 Data Leakage Prevention (MANDATORY)

- Logs MUST NOT expose tenant data belonging to other tenants
- Exports MUST be tenant-scoped
- API responses MUST be tenant-scoped
- Error messages MUST NOT reveal other tenants' data or object existence
- Tenant-owned files MUST contain `business_unit_id`
- Cross-tenant file access is PROHIBITED
- Signed file URLs MUST validate tenant ownership before generation

**Violation:** Cross-tenant data exposure = CRITICAL security breach.

### 5.14 Tenant-Aware Unique Constraints (MANDATORY)

All unique constraints on tenant-owned fields MUST include `business_unit_id`.

```sql
-- REQUIRED:
UNIQUE (business_unit_id, email)
UNIQUE (business_unit_id, code)

-- PROHIBITED:
UNIQUE (email)        -- Global uniqueness on tenant-owned field
UNIQUE (code)         -- Global uniqueness on tenant-owned field
```

**Violation:** Global uniqueness on tenant-owned fields = CRITICAL design error.

### 5.15 Tenant-Aware Foreign Key Enforcement (MANDATORY)

Foreign key relationships between tenant-owned records MUST enforce tenant consistency.

Before saving any relation:
- Parent and child records MUST have the same `business_unit_id`
- Cross-tenant foreign key relationships are PROHIBITED

```python
# REQUIRED repository validation:
if child.business_unit_id != parent.business_unit_id:
    raise ValidationError("Cross-tenant relationship is PROHIBITED")
```

**Violation:** Cross-tenant foreign key relationship = CRITICAL violation.

### 5.16 Tenant-Safe Cache Keys (MANDATORY)

Cache keys for tenant-owned data MUST include `business_unit_id` in the key structure.

Required cache key formats:

Tenant-scoped cache:
```text
{module}:{business_unit_id}:{resource_identifier}
```

User + tenant scoped cache:
```text
{module}:{user_id}:{business_unit_id}:{resource_identifier}
```

Examples:
```text
inventory:bu-uuid:all                          ✅
permissions:user-uuid:bu-uuid                  ✅
dashboard:user-uuid:bu-uuid:summary            ✅
domains:all                                    ✅ (Reference data - global key allowed)
```

PROHIBITED:
```text
inventory_list          ❌ no tenant scope
permissions             ❌ no user scope
dashboard_stats         ❌ shared across tenants
```

**Violation:** Unscoped cache key on tenant data = cross-tenant cache leakage (CRITICAL).

### 5.17 GLOBAL Scope Data Access Pattern (MANDATORY)

For users with `data_scope = "GLOBAL"`:

```python
def get_data(self, security_context):
    if security_context["data_scope"] == "GLOBAL":
        return self.repo.fetch_all_authorized()  # RBAC-approved, tenant-expanded, still security-filtered
    return self.repo.fetch_by_business_units(
        security_context["allowed_business_unit_ids"]
    )
```

GLOBAL scope:
- MUST still pass authentication
- MUST still pass RBAC permission checks
- Bypasses ONLY the tenant restriction - and ONLY for the specific permission that has GLOBAL scope

---

## 6. SECURITY & COMPLIANCE

### Tenant Security

- Tenant isolation MUST be enforced at ALL layers (API, Service, Repository, Cache, File)
- Cross-tenant access is PROHIBITED
- Any cross-tenant data exposure is a CRITICAL security breach

### Access Control

- RBAC MUST be enforced before tenant checks
- Authorization order: Authentication → RBAC Check → Tenant Scope Check → Execution
- Reordering this sequence is PROHIBITED

### Data Protection

- Tenant data MUST NOT be exposed in logs, exports, error messages, or API responses of other tenants
- PII in logs MUST use opaque UUIDs - never raw personal data

### Audit Logging

All tenant-related security events MUST be logged:

```json
{
  "user_id": "uuid",
  "business_unit_id": "uuid",
  "action": "RESOURCE_VERB",
  "result": "ALLOWED | DENIED",
  "trace_id": "uuid",
  "correlation_id": "uuid",
  "timestamp": "utc_iso8601"
}
```

---

## 7. TENANT ISOLATION PRE-DEPLOYMENT CHECKLIST

Before every production deployment, the following checks MUST pass:

```text
□ All tables are classified (Tenant-Owned / Platform / Audit)
□ All tenant-owned tables include business_unit_id (NOT NULL)
□ No NULL business_unit_id on active tenant-owned records (SQL check passes)
□ Tenant-owned foreign keys point to valid BusinessUnits
□ No cross-tenant FK relationships exist
□ Active non-admin users have at least one BusinessUnit membership
□ UserRole scope matches Role.data_scope
□ BU-scoped UserRole assignments match user membership
□ All tenant-owned repository queries include business_unit_id scope
□ Service layer validates selected_business_unit_id against allowed list
□ All cache keys include business_unit_id or user_id where applicable
□ NO_SCOPE usage reviewed and justified
□ Cross-tenant access tests pass
□ All BusinessUnits belong to valid Organizations
□ No cross-organization UserBusinessUnit memberships exist
□ Organization aggregation queries are RBAC-protected
□ Signed URL tenant validation tests pass
□ Bulk operation tenant scope tests pass
□ Async retry tenant-scope tests pass
```

SQL validation examples:

```sql
-- No NULL business_unit_id on active tenant-owned records
SELECT COUNT(*) FROM inventory WHERE business_unit_id IS NULL AND is_deleted = FALSE;
-- Expected: 0

-- No orphan tenant records
SELECT COUNT(*) FROM inventory i
LEFT JOIN business_units bu ON i.business_unit_id = bu.id
WHERE bu.id IS NULL;
-- Expected: 0

-- No cross-organization BusinessUnit memberships
SELECT COUNT(*) FROM user_business_units ubu
JOIN business_units bu ON ubu.business_unit_id = bu.id
JOIN users u ON ubu.user_id = u.id
WHERE bu.organization_id != (SELECT organization_id FROM user_business_units WHERE user_id = u.id LIMIT 1);
-- Expected: 0 (or justified exceptions)
```

Any failing check = DEPLOYMENT BLOCKED.

---

## 8. NON-NEGOTIABLE RULES

- Tenant isolation MUST be enforced by architecture, NOT developer memory
- Reusable tenant-scoping infrastructure is REQUIRED
- Missing tenant filter = CRITICAL violation
- Object fetch without tenant scope = CRITICAL violation
- Cross-tenant access = CRITICAL violation
- Trusting client-provided `business_unit_id` without backend validation = PROHIBITED
- Unscoped cache key for tenant data = CRITICAL violation
- NO_SCOPE misuse for tenant-owned data = CRITICAL violation
- Mixed-tenant bulk operations = PROHIBITED
- Cross-organization tenant linkage = CRITICAL architecture violation
- Background job without tenant context for tenant data = CRITICAL violation

---

## 9. VIOLATIONS & ENFORCEMENT

Non-compliant code MUST NOT be merged or deployed.

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 10. TESTING REQUIREMENTS

- All queries MUST be tested for tenant filtering
- Cross-tenant access tests REQUIRED (user A cannot access user B's data)
- Object-level fetch tests MUST verify `business_unit_id` scope
- GLOBAL scope tests MUST verify RBAC still enforces permissions
- Bulk operation tests MUST validate scope
- Background job tests MUST validate tenant context
- Cache key tests MUST verify tenant scope
- Signed URL tenant validation tests REQUIRED
- Cross-organization isolation tests REQUIRED
- Tenant-safe soft delete tests REQUIRED
- Cache leakage timing tests REQUIRED
- Async retry tenant-scope tests REQUIRED
- Any failing test MUST block deployment

---

## 11. QUICK SUMMARY

- All tenant-owned data MUST have `business_unit_id` (NOT NULL)
- Every BusinessUnit MUST belong to exactly one Organization
- Cross-tenant access is PROHIBITED without explicit RBAC-approved GLOBAL scope
- `security_context` is the ONLY source of tenant scope - never trust client input
- Two-layer enforcement: Service (validation) + Repository (query filter)
- Object-level fetch MUST include `business_unit_id`
- Cache keys MUST be tenant-scoped

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.
