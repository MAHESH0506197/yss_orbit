<!-- yss_orbit\rulebooks\B08 - DATABASE DESIGN STANDARDS (POSTGRESQL).md -->
# B08 - DATABASE DESIGN STANDARDS (POSTGRESQL)

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01 (System Foundation), B02 (Multi-Tenant), B03 (Domain Model)
**Governance Role:** Database Design Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Table structure rules, data integrity constraints, indexing standards, PostgreSQL-specific standards, migration safety requirements, zero-downtime migration process, audit log table schema, data type standards |
| REFERENCES | B01 (soft delete fields, timestamps, UUID PKs), B02 (tenant column, tenant-unique constraints, tenant FK enforcement), B03 (entity lifecycle fields) |
| MUST NOT DUPLICATE | Tenant isolation logic (B02), soft delete governance (B01 §5.5), audit logging governance (B01 §5.23) |

---

## 1. PURPOSE

This rulebook defines the **mandatory database design standards** for YSS Orbit PostgreSQL databases.

It establishes:
- Table structure rules
- Data integrity constraints
- Indexing and performance guidelines
- Migration safety requirements
- PostgreSQL-specific standards

All database design MUST follow these rules.

---

## 2. SCOPE

Applies to: all database tables and schemas, all PostgreSQL configurations, all indexes and constraints, all migrations and schema changes. No database object is exempt.

---

## 3. DEFINITIONS

| Term | Definition |
|------|-----------|
| Partial Index | Index with conditional filtering (e.g., `WHERE is_deleted = FALSE`) |
| Zero-Downtime Migration | Schema change without service interruption |
| `TIMESTAMPTZ` | Timestamp with timezone - always UTC in PostgreSQL |
| Append-Only Table | Table where UPDATE and DELETE are PROHIBITED (audit logs) |

---

## 4. CORE GOVERNANCE LAWS

### 4.1 Primary Keys (MANDATORY)

- All tables MUST use UUID as primary key (`UUIDv4` or `UUIDv7`)
- Integer-based primary keys are PROHIBITED
- UUID primary keys MUST be system-generated - NEVER client-provided

WHY: UUID PKs prevent ID enumeration attacks, enable future distributed systems, and eliminate cross-tenant ID collisions.

### 4.2 Table Structure (MANDATORY)

- Tables MUST be normalized
- Each table MUST represent a single entity or relationship
- Redundant columns are PROHIBITED unless explicitly justified and documented

### 4.3 Tenant Column (MANDATORY)

- Tenant-owned tables MUST include `business_unit_id` (NOT NULL)
- Global/platform tables MUST NOT include `business_unit_id` as an ownership field
- See B02 §5.1 for full data classification rules
- Alternative column names for tenant ownership (`tenant_id`, `bu_id`, etc.) are PROHIBITED

### 4.4 Unique Constraints (MANDATORY)

- Unique constraints on tenant-owned fields MUST include `business_unit_id`
- Global uniqueness constraints on tenant-owned fields are PROHIBITED

```sql
-- REQUIRED:
UNIQUE (business_unit_id, email)
UNIQUE (business_unit_id, product_code)

-- PROHIBITED (for tenant-owned data):
UNIQUE (email)         -- Global uniqueness
UNIQUE (product_code)  -- Global uniqueness
```

### 4.5 Indexing (MANDATORY)

- Frequently queried columns MUST be indexed
- Composite indexes on tenant-owned tables MUST include `business_unit_id` as the LEADING column
- All foreign key columns MUST be indexed
- All `ORDER BY` columns MUST be indexed where used in high-volume queries

Index naming convention:
```text
idx_{table}_{column(s)}
Examples:
  idx_inventory_bu
  idx_inventory_bu_active
  idx_users_email
  idx_employees_bu_code
```

### 4.6 Partial Indexes (MANDATORY)

Partial indexes MUST be used for:

Active records (soft delete):
```sql
CREATE INDEX idx_inventory_active
ON inventory(business_unit_id)
WHERE is_deleted = FALSE AND is_active = TRUE;
```

Unique constraints on soft-deletable fields:
```sql
CREATE UNIQUE INDEX uidx_inventory_code_active
ON inventory(business_unit_id, code)
WHERE is_deleted = FALSE;
```

### 4.7 Foreign Keys (MANDATORY)

- Foreign keys MUST enforce referential integrity
- `ON DELETE CASCADE` is PROHIBITED for business/platform entities
- Use `PROTECT`, `RESTRICT`, or `SET NULL` according to data contract
- Cross-tenant foreign keys are PROHIBITED (see B02 §5.15)
- Cross-module physical foreign keys are PROHIBITED (see B05 §5.4)

### 4.8 Constraints (MANDATORY)

- NOT NULL constraints MUST be applied to all required fields
- Check constraints MUST enforce data validity where applicable

```sql
-- Required constraint examples:
business_unit_id UUID NOT NULL
data_scope VARCHAR(20) NOT NULL CHECK (data_scope IN ('GLOBAL', 'BUSINESS_UNIT'))
status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'pending'))
```

### 4.9 Timestamps (MANDATORY)

- All tables MUST include `created_at` and `updated_at`
- Timestamps MUST use `TIMESTAMPTZ` (timestamp with timezone)
- All timestamps MUST be stored in UTC

```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### 4.10 Soft Delete Support (MANDATORY)

Soft delete MUST use:
```sql
is_deleted  BOOLEAN NOT NULL DEFAULT FALSE
is_active   BOOLEAN NOT NULL DEFAULT TRUE
deleted_at  TIMESTAMPTZ NULL
deleted_by  UUID REFERENCES users(id) ON DELETE SET NULL
```

- Queries MUST exclude deleted records by default
- `ON DELETE CASCADE` constraints that would physically delete business data are PROHIBITED

### 4.11 Model Status Fields (MANDATORY)

All long-lived business entities MUST include (per B01 §5.5):

```sql
is_active     BOOLEAN NOT NULL DEFAULT TRUE
is_deleted    BOOLEAN NOT NULL DEFAULT FALSE
created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
created_by    UUID REFERENCES users(id) ON DELETE SET NULL
updated_by    UUID REFERENCES users(id) ON DELETE SET NULL
```

### 4.12 Migration Rules (MANDATORY - Including Zero-Downtime)

All schema changes MUST use Django migrations. Manual DB changes are PROHIBITED in any environment.

**Zero-Downtime Column Addition (3-Step Process):**

NEVER add a NOT NULL column in a single migration on a non-empty table.

Step 1 - Add nullable (deploy immediately, zero downtime):
```python
# Migration 001_add_nullable_column
new_field = models.CharField(max_length=100, null=True, blank=True)
```

Step 2 - Backfill data (data migration):
```python
# Migration 002_backfill_new_field
def backfill(apps, schema_editor):
    Model = apps.get_model("app", "Model")
    Model.objects.filter(new_field=None).update(new_field="default_value")
```

Step 3 - Enforce NOT NULL constraint (separate deployment):
```python
# Migration 003_make_not_null
new_field = models.CharField(max_length=100, null=False)
```

Additional migration rules:
- All migrations MUST be reversible (include rollback path)
- Column renaming MUST be done in two steps: add new → backfill → remove old
- Primary key fields MUST NEVER be changed
- Migrations MUST be tested on a staging DB copy before production
- Breaking migrations (removing columns used by deployed code) are PROHIBITED

**Violation:** Single-step NOT NULL addition on non-empty table = deployment failure risk (HIGH).

### 4.13 Naming Standards (MANDATORY)

- Table names MUST be `snake_case`
- Column names MUST be `snake_case` and descriptive
- Abbreviations in names are PROHIBITED
- Table and column names MUST be consistent across the schema

### 4.14 Data Type Standards (MANDATORY)

- Date and time fields MUST use `TIMESTAMPTZ`
- Financial and precise numeric data MUST use `DECIMAL` or `NUMERIC`
- `FLOAT` or `REAL` for precise financial data is PROHIBITED

```sql
-- REQUIRED:
amount DECIMAL(12, 2) NOT NULL

-- PROHIBITED:
amount FLOAT    -- Precision loss
amount REAL     -- Precision loss
```

### 4.15 JSONB Usage (MANDATORY)

JSONB columns MUST ONLY be used for:
- Unstructured metadata
- Non-critical flexible fields

JSONB MUST NOT be used for:
- Relational data
- Foreign key mapping
- Core business entities
- Data that needs to be filtered or queried in business logic

Critical queryable data MUST be stored in structured typed columns.

### 4.16 Audit Log Table Requirements (MANDATORY)

```sql
CREATE TABLE audit_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id         UUID NOT NULL,
    user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    business_unit_id UUID,
    action           VARCHAR(100) NOT NULL,   -- MODULE_ACTION format
    resource         VARCHAR(100) NOT NULL,
    resource_id      UUID,
    old_values       JSONB,                   -- State before mutation
    new_values       JSONB,                   -- State after mutation
    ip_address       VARCHAR(45),
    status           VARCHAR(20) NOT NULL,    -- SUCCESS / FAILURE
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Audit logs are APPEND-ONLY:
- `UPDATE` on audit_log records = PROHIBITED
- `DELETE` on audit_log records = PROHIBITED
- Application code MUST NOT modify audit logs after creation

---

### 4.17 Outbox Table Schema (MANDATORY)

Every deployment MUST include the event outbox table (governed by E01 §4.3):

```sql
CREATE TABLE event_outbox (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id         UUID NOT NULL UNIQUE,
    event_type       VARCHAR(200) NOT NULL,
    event_version    VARCHAR(20) NOT NULL DEFAULT '1.0',
    business_unit_id UUID,
    organization_id  UUID,
    aggregate_id     UUID NOT NULL,
    aggregate_type   VARCHAR(100) NOT NULL,
    correlation_id   UUID NOT NULL,
    payload          JSONB NOT NULL,
    occurred_at      TIMESTAMPTZ NOT NULL,
    published_at     TIMESTAMPTZ,
    publish_attempts INTEGER DEFAULT 0,
    last_attempt_at  TIMESTAMPTZ,
    status           VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbox_pending  ON event_outbox(created_at) WHERE status = 'pending';
CREATE INDEX idx_outbox_event_id ON event_outbox(event_id);
CREATE INDEX idx_outbox_bu       ON event_outbox(business_unit_id) WHERE business_unit_id IS NOT NULL;
```

Outbox worker queries only rows WHERE status = 'pending', ordered by created_at ASC, LIMIT 100 per batch.

### 4.18 Dead-Letter Table Schema (MANDATORY)

```sql
CREATE TABLE event_dead_letter (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id         UUID NOT NULL,
    event_type       VARCHAR(200) NOT NULL,
    business_unit_id UUID,
    correlation_id   UUID,
    payload          JSONB NOT NULL,
    failure_reason   TEXT NOT NULL,
    failed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retry_count      INTEGER NOT NULL,
    acknowledged     BOOLEAN DEFAULT FALSE,
    acknowledged_by  UUID REFERENCES users(id),
    acknowledged_at  TIMESTAMPTZ
);
```

### 4.19 Orchestrator State Table (MANDATORY)

```sql
CREATE TABLE orchestrator_state (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id      UUID NOT NULL UNIQUE,
    orchestrator     VARCHAR(100) NOT NULL,
    business_unit_id UUID NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'running',
    completed_steps  TEXT[] DEFAULT '{}',
    entity_id        UUID,
    correlation_id   UUID NOT NULL,
    error_message    TEXT,
    started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ,
    created_by       UUID REFERENCES users(id)
);

CREATE INDEX idx_orch_state_bu     ON orchestrator_state(business_unit_id);
CREATE INDEX idx_orch_state_status ON orchestrator_state(status) WHERE status IN ('running', 'failed');
```

### 4.20 Processed Events Table - Idempotency (MANDATORY)

```sql
CREATE TABLE processed_event (
    event_id         UUID PRIMARY KEY,
    event_type       VARCHAR(200) NOT NULL,
    processor        VARCHAR(100) NOT NULL,
    processed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Partitioned by processed_at month for archival
```

### 4.21 Table Partitioning Strategy (MANDATORY)

High-volume tables MUST be designed with partitioning from inception:

| Table | Partition Strategy | Partition Key | Retention |
|-------|--------------------|---------------|-----------|
| `attendance_logs` | RANGE by month | `date` | 2 years active, archive beyond |
| `audit_logs` | RANGE by month | `created_at` | 5 years active, archive beyond |
| `event_outbox` | RANGE by month | `created_at` | 3 months (published events purged) |
| `processed_event` | RANGE by month | `processed_at` | 6 months |
| `payroll_runs` | RANGE by year | `created_at` | 7 years (statutory) |
| `pos_bills` | RANGE by month | `created_at` | 3 years active |
| `stock_transactions` | RANGE by month | `created_at` | 2 years active |
| `notifications` | RANGE by month | `created_at` | 1 year active |

```sql
CREATE TABLE attendance_logs (
    id               UUID NOT NULL,
    business_unit_id UUID NOT NULL,
    employee_id      UUID NOT NULL,
    date             DATE NOT NULL,
    check_in         TIMESTAMPTZ,
    check_out        TIMESTAMPTZ,
    status           VARCHAR(20) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (date);
```

### 4.22 Domain Table (MANDATORY - replaces retired Sector table)

The `sector` table is RETIRED. The `domain` table is REQUIRED:

```sql
CREATE TABLE domain (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50) UNIQUE NOT NULL,   -- 'RETAIL', 'PHARMACY', 'HRMS'
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Any column named `sector_id` or `sector_code` MUST be renamed to `domain_id` or `domain_code`.
Migration MUST follow the zero-downtime three-step process (§4.12).


## 5. SECURITY & COMPLIANCE

- Database access MUST be restricted to the application service account
- Direct database access from external systems is PROHIBITED
- Sensitive data MUST be encrypted at rest (see B09)
- All queries MUST enforce tenant isolation (B02)

---

## 6. NON-NEGOTIABLE RULES

- Integer primary keys = PROHIBITED
- Global uniqueness on tenant-owned fields = PROHIBITED
- Manual DB changes in any environment = PROHIBITED
- Single-step NOT NULL addition on non-empty table = HIGH risk violation
- `FLOAT`/`REAL` for financial data = PROHIBITED
- JSONB for relational/core business data = PROHIBITED
- `ON DELETE CASCADE` on business/platform entities = PROHIBITED
- Modifying or deleting audit log records = PROHIBITED (CRITICAL)
- Cross-tenant FK relationships = PROHIBITED (CRITICAL)
- Cross-module physical FK relationships = PROHIBITED (CRITICAL)
- Missing event_outbox or event_dead_letter table = PROHIBITED
- Using 'sector' table or sector_id column = PROHIBITED (use 'domain')
- High-volume tables not partitioned from inception = PROHIBITED

---

## 7. VIOLATIONS & ENFORCEMENT

Non-compliant schema MUST NOT be deployed.

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject migration |
| MEDIUM | Fix required |

---

## 8. TESTING REQUIREMENTS

- Schema integrity MUST be tested
- Index usage MUST be validated (`EXPLAIN ANALYZE` in development)
- Constraint validation MUST be tested
- Migration tests MUST be executed on staging before production
- Rollback MUST be tested for every migration
- Any failing test MUST block deployment

---

## 9. QUICK SUMMARY

- UUID primary keys REQUIRED
- `TIMESTAMPTZ` for all timestamps (UTC)
- `DECIMAL`/`NUMERIC` for financial data
- Tenant-aware unique constraints REQUIRED
- Three-step zero-downtime migration for NOT NULL columns
- Audit logs: `old_values` + `new_values` REQUIRED, append-only
- No manual DB changes - migrations only

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.
