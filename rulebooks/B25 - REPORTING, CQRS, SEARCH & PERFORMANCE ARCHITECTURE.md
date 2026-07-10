<!-- yss_orbit\rulebooks\B25 - REPORTING, CQRS, SEARCH & PERFORMANCE ARCHITECTURE.md -->
# B25 - REPORTING, CQRS, SEARCH & PERFORMANCE ARCHITECTURE

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Series:** Backend Platform Governance
**Depends On:** B01, B04 (Application Architecture), B08 (Database Design), B13 (Async Processing), B19 (Scalability)
**Governance Role:** Reporting & Query Architecture Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Reporting architecture standards, CQRS (Command Query Responsibility Segregation) patterns, read replica routing, materialized view strategy, async report generation, scheduled reports, global search architecture, query performance governance, N+1 prevention, tenant-scoped search indexing |
| REFERENCES | B08 (read replica setup, partitioned tables), B13 (async jobs - report exports), B15 (audit log reporting), B19 (SLO targets for query performance), E03 (observability - slow query alerts) |
| MUST NOT DUPLICATE | Async job patterns (B13), database partitioning (B08 §4.21), SLO definitions (E03 §3.5) |

---

## 1. PURPOSE

Reporting is the #1 enterprise pain point. Clients always want:
- More data
- More filters
- More export formats
- Scheduled delivery
- Huge cross-module aggregations

Without a governed reporting architecture, these requirements destroy operational database performance and make the platform unusable for all tenants when one tenant runs a large report.

This rulebook prevents reporting from becoming a performance nightmare.

---

## 2. CQRS PATTERN FOR REPORTING (MANDATORY)

### 2.1 What CQRS Means in YSS Orbit

CQRS stands for **Command Query Responsibility Segregation**. In YSS Orbit this means:

| Path | Purpose | Database | Latency Budget |
|------|---------|----------|---------------|
| **Command Path** | Writes and real-time operational reads | Primary DB (writes) | < 200ms |
| **Query Path** | Reporting, analytics, exports, dashboards | Read replica + materialized views | Async (job-based) |

**Why CQRS for reporting:**
Without separation, a single large report query from one tenant (e.g., "all attendance records for the last 2 years across 500 employees") can consume enough DB resources to slow down ALL other tenants' real-time operations. Read replicas and async job-based reporting prevent this completely.

### 2.2 Route Classification (MANDATORY)

Every query in the system MUST be classified as Command Path or Query Path before implementation:

| Query Type | Path | Route To |
|-----------|------|---------|
| Create/Update/Delete operations | Command | Primary DB |
| Single-record fetch (operational) | Command | Primary DB |
| List with basic filters (operational) | Command | Primary DB |
| Dashboard aggregations | Query | Read replica |
| Reports (any cross-module or date-range) | Query | Read replica + async job |
| Exports (CSV, Excel, PDF) | Query | Read replica + async job |
| Analytics (trend data, summaries) | Query | Read replica + materialized view |
| Audit log browsing | Query | Read replica (separate audit replica) |
| Search (full-text, cross-module) | Query | Search index (see §6) |

### 2.3 Read Replica Routing (MANDATORY)

```python
# Django database router - MANDATORY implementation:
class YSSOrbitDatabaseRouter:
    """
    Routes queries to the appropriate database:
    - Write operations → primary
    - Reporting/analytics → read replica
    - Audit queries → audit read replica (if separate)
    """
    REPORTING_APPS = ['reports', 'analytics', 'exports', 'audit_viewer']

    def db_for_read(self, model, **hints):
        # Reports app always reads from replica
        if model._meta.app_label in self.REPORTING_APPS:
            return 'replica'
        # Hint: explicit replica routing for heavy queries
        if hints.get('use_replica'):
            return 'replica'
        # Default: primary (for operational reads)
        return 'default'

    def db_for_write(self, model, **hints):
        return 'default'  # Always write to primary

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return db == 'default'  # Migrations only on primary

# Usage in reporting service:
queryset = PayrollRun.objects.using('replica').filter(
    business_unit_id=ctx.selected_business_unit_id,
    created_at__gte=start_date,
)
# OR via hint:
queryset = PayrollRun.objects.filter(...).using('replica')
```

---

## 3. MATERIALIZED VIEWS (MANDATORY for Common Reports)

### 3.1 What Materialized Views Solve

Frequently-accessed report aggregations MUST be pre-computed as materialized views and refreshed asynchronously. This converts expensive real-time aggregations into fast pre-computed reads.

### 3.2 Required Materialized Views

```sql
-- 1. Monthly Attendance Summary (refreshed nightly)
CREATE MATERIALIZED VIEW mv_attendance_monthly_summary AS
SELECT
    business_unit_id,
    employee_id,
    DATE_TRUNC('month', date) AS period_month,
    COUNT(*) AS total_working_days,
    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_days,
    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_days,
    SUM(CASE WHEN status = 'half_day' THEN 0.5 ELSE 0 END) AS half_days,
    SUM(CASE WHEN is_late = TRUE THEN 1 ELSE 0 END) AS late_days
FROM attendance_logs
WHERE is_deleted = FALSE
GROUP BY business_unit_id, employee_id, DATE_TRUNC('month', date);

CREATE UNIQUE INDEX ON mv_attendance_monthly_summary(business_unit_id, employee_id, period_month);

-- 2. Payroll Summary by Month (refreshed after each payroll run)
CREATE MATERIALIZED VIEW mv_payroll_monthly_summary AS
SELECT
    business_unit_id,
    DATE_TRUNC('month', period_start) AS period_month,
    COUNT(DISTINCT employee_id) AS employee_count,
    SUM(gross_salary) AS total_gross,
    SUM(net_salary) AS total_net,
    SUM(pf_deduction) AS total_pf,
    SUM(esi_deduction) AS total_esi,
    SUM(tds_deduction) AS total_tds
FROM payslips
WHERE status = 'processed'
GROUP BY business_unit_id, DATE_TRUNC('month', period_start);

-- 3. Inventory Stock Levels (refreshed hourly)
CREATE MATERIALIZED VIEW mv_inventory_stock_levels AS
SELECT
    business_unit_id,
    item_id,
    SUM(CASE WHEN transaction_type = 'in' THEN quantity ELSE -quantity END) AS current_stock,
    MAX(created_at) AS last_movement_at
FROM stock_transactions
WHERE is_deleted = FALSE
GROUP BY business_unit_id, item_id;
```

### 3.3 Materialized View Refresh Jobs (MANDATORY)

```python
# Scheduled refresh jobs - run via Celery Beat:
@shared_task(name='reporting.refresh_attendance_summary')
def refresh_attendance_summary():
    """Runs nightly at 00:30 UTC - off-peak."""
    with connection.cursor() as cursor:
        cursor.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_attendance_monthly_summary;")

@shared_task(name='reporting.refresh_stock_levels')
def refresh_stock_levels():
    """Runs hourly."""
    with connection.cursor() as cursor:
        cursor.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_inventory_stock_levels;")
```

**`CONCURRENTLY` keyword is MANDATORY** - it allows reads during refresh. Non-concurrent refresh locks the view and blocks all reads during refresh.

---

## 4. ASYNC REPORT GENERATION (MANDATORY)

All reports involving more than 1,000 rows or spanning more than 30 days of data MUST be generated as background jobs, not inline API responses.

### 4.1 Report Generation Pattern

```python
# API endpoint - returns job_id immediately (202 Accepted):
class GeneratePayrollReportView(APIView):
    def post(self, request):
        validated = PayrollReportRequestSerializer(data=request.data)
        validated.is_valid(raise_exception=True)

        job = BackgroundJob.objects.create(
            business_unit_id=request.security_context.selected_business_unit_id,
            user_id=request.security_context.user_id,
            job_type='REPORT_EXPORT',
            payload={
                'report_type': 'payroll_monthly',
                'month': validated.data['month'],
                'year': validated.data['year'],
                'format': validated.data['format'],  # 'xlsx' | 'pdf' | 'csv'
            },
            correlation_id=request.security_context.correlation_id,
        )
        generate_report_task.delay(job_id=str(job.id))
        return Response({'job_id': str(job.id), 'status': 'queued'}, status=202)

# Background task:
@shared_task(bind=True, name='reporting.generate_report')
def generate_report_task(self, job_id: str):
    job = BackgroundJob.objects.get(id=job_id)
    try:
        report_bytes = ReportGeneratorService.generate(
            report_type=job.payload['report_type'],
            business_unit_id=job.business_unit_id,
            params=job.payload,
        )
        url = FileStorageService.upload_report(report_bytes, job)
        job.status = 'completed'
        job.result_url = url
        job.save()
    except Exception as e:
        job.status = 'failed'
        job.error_message = str(e)
        job.save()
        raise
```

### 4.2 Scheduled Reports (MANDATORY support)

Tenants MUST be able to schedule reports for automatic generation and delivery:

```sql
CREATE TABLE scheduled_report (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    report_type      VARCHAR(100) NOT NULL,
    schedule_cron    VARCHAR(100) NOT NULL,  -- e.g., '0 9 1 * *' = 9am on 1st of month
    params_json      JSONB NOT NULL,         -- report parameters
    recipients       TEXT[] NOT NULL,        -- email addresses
    format           VARCHAR(10) NOT NULL DEFAULT 'xlsx',
    is_active        BOOLEAN DEFAULT TRUE,
    last_run_at      TIMESTAMPTZ,
    created_by       UUID REFERENCES users(id)
);
```

---

## 5. N+1 QUERY PREVENTION (MANDATORY)

### 5.1 N+1 Problem Definition

```python
# N+1 PROBLEM - PROHIBITED:
employees = Employee.objects.filter(business_unit_id=ctx.selected_business_unit_id)
for emp in employees:
    # This runs 1 DB query PER EMPLOYEE (if 1000 employees = 1001 queries):
    dept = emp.department  # Foreign key access - lazy load = N+1
    print(f"{emp.name} in {dept.name}")

# CORRECT - REQUIRED:
employees = Employee.objects.filter(
    business_unit_id=ctx.selected_business_unit_id
).select_related('department', 'designation')   # 1 query with JOINs
for emp in employees:
    print(f"{emp.name} in {emp.department.name}")  # No additional queries

# For many-to-many or reverse FK:
employees = Employee.objects.filter(
    business_unit_id=ctx.selected_business_unit_id
).prefetch_related('skills', 'documents')        # Prefetch in 2 additional queries
```

### 5.2 N+1 Detection (MANDATORY in Development)

```python
# settings/development.py - enable N+1 detection:
from django.test.utils import override_settings
# Use django-silk or nplusone library to detect N+1 in development:
INSTALLED_APPS += ['silk']
SILKY_PYTHON_PROFILER = True
SILKY_MAX_RECORDED_REQUESTS = 1000
```

All developer workstations and CI environments MUST have N+1 detection enabled. Any PR that introduces an N+1 query pattern MUST be blocked by code review.

### 5.3 Query Performance Mandates

From B19 - enforced here with specifics:
- No query without a covering index for `business_unit_id` + primary filter column - MANDATORY
- No sequential scan on tables > 10,000 rows - MANDATORY
- `EXPLAIN ANALYZE` required for all new queries before deployment - MANDATORY
- Slow query log threshold: 500ms → logged as WARNING; 1000ms → alert (E03)
- Joining > 4 tables in a single query requires ARB review

---

## 6. GLOBAL SEARCH ARCHITECTURE (MANDATORY)

### 6.1 Why Global Search Needs Its Own Architecture

Enterprise users need to search across modules:
- "Find employee Priya across all records"
- "Find invoice #INV-HYD-1234"
- "Find all attendance records for last week with 'absent' status"

Naive implementation (CTRL+F style database `LIKE '%query%'`) at enterprise scale causes:
- Full table scans (catastrophic performance)
- Cross-tenant data leaks if not carefully scoped
- Response times > 10 seconds for complex searches

### 6.2 Search Architecture

```
Search Request (tenant-scoped)
         ↓
SearchService (enforces business_unit_id scope - MANDATORY)
         ↓
    ┌────┴────┐
    │         │
PostgreSQL   Search Index (Elasticsearch / Typesense / PostgreSQL FTS)
FTS          For cross-module structured search
(simple)     (complex, faceted)
```

### 6.3 PostgreSQL Full-Text Search (Phase 1 - Mandatory Minimum)

For the initial platform build, PostgreSQL FTS with `tsvector` is mandatory:

```sql
-- Employee full-text search index:
ALTER TABLE employees ADD COLUMN search_vector tsvector;
CREATE INDEX idx_employee_search ON employees USING GIN(search_vector);

-- Update search_vector on insert/update via trigger:
CREATE OR REPLACE FUNCTION update_employee_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.full_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.employee_code, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**ALL search queries MUST include `business_unit_id` filter - search MUST NOT cross tenant boundaries.**

```python
# CORRECT tenant-scoped search:
def search_employees(query: str, ctx: SecurityContext) -> QuerySet:
    return Employee.objects.filter(
        business_unit_id=ctx.selected_business_unit_id,  # MANDATORY tenant scope
        is_deleted=False,
        search_vector=SearchQuery(query),
    ).annotate(rank=SearchRank('search_vector', SearchQuery(query))).order_by('-rank')

# PROHIBITED - no tenant scope:
def search_employees_unsafe(query: str) -> QuerySet:
    return Employee.objects.filter(search_vector=SearchQuery(query))
    # Returns results from ALL tenants - CRITICAL security violation
```

### 6.4 Search Index Schema (Cross-Module Unified Search)

```sql
CREATE TABLE search_index (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    entity_type      VARCHAR(50) NOT NULL,    -- 'employee', 'invoice', 'payroll_run'
    entity_id        UUID NOT NULL,
    display_title    VARCHAR(500) NOT NULL,   -- shown in search results
    display_subtitle VARCHAR(500),
    search_text      TEXT NOT NULL,           -- full searchable content
    search_vector    tsvector,               -- auto-generated from search_text
    module_code      VARCHAR(50) NOT NULL,    -- 'HRMS', 'BILLING', 'PAYROLL'
    url_path         VARCHAR(500),            -- deep link to entity in frontend
    indexed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_unit_id, entity_type, entity_id)
);

CREATE INDEX idx_search_index_bu   ON search_index USING GIN(search_vector) WHERE business_unit_id IS NOT NULL;
CREATE INDEX idx_search_index_type ON search_index(business_unit_id, entity_type);
```

Search index MUST be updated via domain events (E01) - when an employee is created/updated, publish `employee.created` / `employee.updated` event → Search Index Consumer updates the search_index table.

---

## 7. NON-NEGOTIABLE RULES

- Report generating more than 1,000 rows inline (not async job) = PROHIBITED
- Read-heavy reporting query hitting primary DB = PROHIBITED (use replica)
- N+1 query pattern in service or view code = PROHIBITED
- Search query without `business_unit_id` filter = CRITICAL security violation
- Materialized view refreshed WITHOUT `CONCURRENTLY` = PROHIBITED (causes read locks)
- Scheduled report job not tenant-scoped = CRITICAL violation
- Query without covering index deployed to production = PROHIBITED
- Sequential scan on table > 10,000 rows without ARB exception = PROHIBITED

---

*THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARB APPROVAL.*
