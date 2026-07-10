# YSS Orbit — Database Strategy

> **Audience:** DBA, Backend engineers, DevOps
> **Covers:** Index strategy, query optimisation, vacuuming, partitioning, connection pooling

---

## 1. Index Inventory

### HRMS App — Key Indexes

| Table | Index Name | Fields | Purpose |
|-------|-----------|--------|---------|
| `hrms_employees` | `emp_bu_status_idx` | `(business_unit_id, employment_status)` | Active employee lookups |
| `hrms_employees` | `emp_state_code_idx` | `(state_code)` | PT slab lookups by state |
| `hrms_attendance_records` | `att_bu_emp_date_idx` | `(business_unit_id, employee_id, attendance_date)` | Payroll attendance fetch |
| `hrms_attendance_records` | `att_bu_date_idx` | `(business_unit_id, attendance_date)` | Daily dashboard queries |
| `hrms_attendance_records` | `att_locked_idx` | `(business_unit_id, is_locked)` | Lock-status filtering |
| `hrms_leave_requests` | `leave_req_bu_status_idx` | `(business_unit_id, status)` | Pending approvals |
| `hrms_leave_requests` | `leave_req_bu_emp_idx` | `(business_unit_id, employee_id)` | ESS leave history |
| `hrms_leave_requests` | `leave_req_bu_start_idx` | `(business_unit_id, start_date)` | Date-range queries |
| `hrms_employee_events` | `ee_bu_emp_date_idx` | `(business_unit_id, employee_id, -event_date)` | Employee 360 timeline |
| `hrms_employee_events` | `ee_bu_type_idx` | `(business_unit_id, event_type)` | Event-type filtering |
| `payroll_payslips` | `payslip_emp_run_idx` | `(employee_id, payroll_run_id)` | ESS payslip fetch |

### Creating High-Traffic Indexes Without Downtime

```sql
-- Use CONCURRENTLY to avoid table lock (takes longer but no downtime)
CREATE INDEX CONCURRENTLY att_bu_emp_date_idx
    ON hrms_attendance_records(business_unit_id, employee_id, attendance_date);

-- Always verify after creation
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'hrms_attendance_records';
```

> [!WARNING]
> Never use plain `CREATE INDEX` on a live table with > 100k rows. Always use `CONCURRENTLY`.

---

## 2. Connection Pooling

Use **pgBouncer** in transaction-mode pooling:

```ini
# /etc/pgbouncer/pgbouncer.ini
[databases]
yss_orbit_prod = host=rds.endpoint.aws.com port=5432 dbname=yss_orbit_prod

[pgbouncer]
pool_mode = transaction
max_client_conn = 500
default_pool_size = 25          # Per-database pool
reserve_pool_size = 5
server_idle_timeout = 60
log_connections = 0
log_disconnections = 0
```

**Django settings (production):**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': 'pgbouncer-host',
        'PORT': 6432,              # pgBouncer port, NOT 5432
        'CONN_MAX_AGE': 0,         # MUST be 0 with transaction-mode pgBouncer
    }
}
```

---

## 3. VACUUM & Autovacuum Tuning

High-churn tables (attendance punches, notification logs) accumulate dead tuples quickly. Tune autovacuum:

```sql
-- For hrms_attendance_punches (very high INSERT rate)
ALTER TABLE hrms_attendance_punches SET (
    autovacuum_vacuum_scale_factor = 0.01,   -- vacuum at 1% dead tuples
    autovacuum_analyze_scale_factor = 0.005,
    autovacuum_vacuum_cost_delay = 2
);

-- For notifications_notification_logs
ALTER TABLE notifications_notification_logs SET (
    autovacuum_vacuum_scale_factor = 0.01,
    autovacuum_analyze_scale_factor = 0.005
);
```

**Check bloat:**
```sql
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(quote_ident(tablename))) AS size,
       n_dead_tup, n_live_tup,
       ROUND(100 * n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;
```

**Manual vacuum (if dead_pct > 20%):**
```sql
VACUUM ANALYZE hrms_attendance_records;
VACUUM ANALYZE hrms_attendance_punches;
```

---

## 4. Table Partitioning (Future)

When `hrms_attendance_records` exceeds **50 million rows**, partition by `attendance_date` (monthly):

```sql
-- Partition parent (no data, range on attendance_date)
CREATE TABLE hrms_attendance_records_partitioned (
    LIKE hrms_attendance_records INCLUDING ALL
) PARTITION BY RANGE (attendance_date);

-- Monthly partitions
CREATE TABLE hrms_attendance_2026_06
    PARTITION OF hrms_attendance_records_partitioned
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
```

> [!NOTE]
> Partitioning is NOT required at launch. Apply when table size > 50M rows or query p95 > 500ms consistently.

---

## 5. Slow Query Monitoring

Enable `pg_stat_statements`:
```sql
-- In postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all

-- Query top 10 slowest
SELECT query, calls, total_exec_time/1000 AS total_sec,
       mean_exec_time AS mean_ms, rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Alert threshold:** Any query with `mean_ms > 200` needs an index or query rewrite.

---

## 6. Read Replicas

For reporting and analytics queries, route reads to a replica:

```python
# config/settings/production.py
DATABASES = {
    'default': {
        # Primary — all writes
    },
    'replica': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': os.environ['REPLICA_HOST'],
        # ... same credentials
    }
}

DATABASE_ROUTERS = ['config.db_router.PrimaryReplicaRouter']
```

**Router pattern:**
```python
class PrimaryReplicaRouter:
    def db_for_read(self, model, **hints):
        # Route analytics models to replica
        if model._meta.app_label in ['hrms_analytics', 'payroll_reports']:
            return 'replica'
        return 'default'

    def db_for_write(self, model, **hints):
        return 'default'   # Always write to primary
```

---

## 7. Backup Verification Schedule

```bash
# Weekly: test restore to staging
pg_restore --list backup.dump | head -20

# Monthly: full restore drill
pg_restore -d yss_orbit_staging backup.dump
python manage.py check
python manage.py showmigrations | grep '\[ \]'
```

See `BACKUP_RESTORE.md` for complete backup procedures.
