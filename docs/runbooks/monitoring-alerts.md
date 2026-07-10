# YSS Orbit — Monitoring & Alerting Guide

> **Audience**: DevOps, SRE, Backend Team
> **Stack**: Django + Celery + Redis + PostgreSQL + React/Vite

---

## 1. Application Health Endpoints

### Backend Health Check

```
GET /api/v1/health/
Response: { "status": "ok", "db": "ok", "cache": "ok", "celery": "ok" }

GET /api/v1/health/db/
Response: { "status": "ok", "latency_ms": 2.1 }

GET /api/v1/health/cache/
Response: { "status": "ok", "backend": "redis" }
```

**Uptime Monitor**: Ping `/api/v1/health/` every 30 seconds.
Alert if: response time > 2000ms or status != 200.

---

## 2. Critical Alerts

### 2.1 Payroll Processing Failures

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| PayrollRun FAILED | `PayrollRun.status = 'FAILED'` | 🔴 P1 | Page on-call immediately |
| Celery queue depth > 100 | Pending payroll tasks > 100 | 🟡 P2 | Scale Celery workers |
| Payroll task timeout | Celery task > 30min | 🟡 P2 | Restart task, check logs |
| Attendance not locked | Payroll attempted without lock | 🟡 P2 | Alert HR admin |

**Query to detect failed runs:**
```python
from apps.payroll.models import PayrollRun
failed = PayrollRun.objects.filter(status='FAILED').select_related()
```

### 2.2 Authentication & Security

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Failed logins > 50/min | Per IP | 🔴 P1 | Auto-block IP, notify security |
| Invalid JWT surge | 401 errors > 100/min | 🔴 P1 | Check for token replay attack |
| Permission escalation | 403 → 200 pattern | 🔴 P1 | Immediate security review |
| Super admin creation | New `is_super_admin=True` | 🟡 P2 | Notify platform admin |

### 2.3 Database Performance

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Slow queries > 5s | Any query > 5000ms | 🟡 P2 | Check EXPLAIN ANALYZE |
| Connection pool exhausted | pg_stat_activity > 90% | 🔴 P1 | Scale DB or add pooler |
| DB size > 80% | Storage utilization | 🟡 P2 | Archive old data / expand |
| Lock waits > 10s | pg_locks contention | 🟡 P2 | Check SELECT FOR UPDATE |
| Replication lag > 60s | Replica behind primary | 🔴 P1 | Investigate replication |

### 2.4 Celery / Background Tasks

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Worker count < 2 | Less than 2 active workers | 🔴 P1 | Restart Celery |
| Dead letter queue > 10 | Failed tasks in DLQ | 🟡 P2 | See `docs/runbooks/dead-letter-events.md` |
| Outbox lag > 5min | Unprocessed outbox events | 🟡 P2 | See `docs/runbooks/outbox-recovery.md` |
| Schedule drift | Beat not running | 🔴 P1 | Restart celery-beat |

---

## 3. Key Metrics to Track

### Business Metrics (Daily)

```python
# Run daily via Celery Beat

# Active tenants
from apps.organization.models import Organization
active = Organization.objects.filter(is_active=True, is_deleted=False).count()

# Active employees
from apps.hrms.models import Employee
employees = Employee.objects.filter(status='ACTIVE').count()

# Payroll runs this month
from apps.payroll.models import PayrollRun
from django.utils import timezone
runs = PayrollRun.objects.filter(
    created_at__month=timezone.now().month,
    status__in=['GENERATED', 'APPROVED', 'LOCKED']
).count()
```

### Infrastructure Metrics

| Metric | Warning | Critical |
|--------|---------|---------|
| CPU (backend) | > 70% | > 90% |
| Memory | > 75% | > 90% |
| Disk I/O | > 80% | > 95% |
| API p95 latency | > 500ms | > 2000ms |
| API error rate | > 1% | > 5% |
| Redis memory | > 70% | > 90% |
| PG connections | > 70% max | > 90% max |

---

## 4. Log Monitoring

### Log Locations

```
/var/log/yss_orbit/
  ├── django.log         # Application logs
  ├── celery.log         # Worker logs
  ├── celery-beat.log    # Scheduler logs
  ├── nginx.log          # Access + error logs
  └── gunicorn.log       # WSGI server logs
```

### Key Log Patterns to Monitor

```bash
# P1: Payroll computation errors
grep "PayrollComputationError\|SalaryComputationError" /var/log/yss_orbit/django.log

# P1: Database errors
grep "OperationalError\|IntegrityError\|ProgrammingError" /var/log/yss_orbit/django.log

# P2: Celery task failures
grep "Task.*FAILURE\|Retry task" /var/log/yss_orbit/celery.log

# P2: Tenant isolation violations (should be 0)
grep "TenantViolation\|CrossTenantAccess" /var/log/yss_orbit/django.log

# Audit trail gaps
grep "AuditLog.*MISSING" /var/log/yss_orbit/django.log
```

### Structured Logging Format

All backend logs use JSON format:
```json
{
  "timestamp": "2026-06-12T00:00:00Z",
  "level": "ERROR",
  "logger": "apps.payroll.services",
  "message": "PayrollRun computation failed",
  "extra": {
    "run_id": "uuid",
    "business_unit_id": "uuid",
    "correlation_id": "uuid",
    "employee_count": 47
  }
}
```

---

## 5. Alerting Channels

| Severity | Channel | Response Time |
|----------|---------|---------------|
| 🔴 P1 (Critical) | PagerDuty + Slack #incidents | 15 minutes |
| 🟡 P2 (High) | Slack #alerts | 1 hour |
| 🟢 P3 (Medium) | Email digest | 24 hours |
| ℹ️ Info | Slack #monitoring | No action required |

---

## 6. Dashboard Queries

### PostgreSQL: Active Sessions
```sql
SELECT pid, state, wait_event_type, wait_event, query_start, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
```

### Slow Queries
```sql
SELECT query, calls, mean_exec_time, max_exec_time, rows
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Tenant Data Volume
```sql
SELECT business_unit_id, COUNT(*) as employees
FROM hrms_employee
WHERE is_deleted = FALSE
GROUP BY business_unit_id
ORDER BY employees DESC;
```

---

## 7. Runbook Links

| Scenario | Runbook |
|----------|---------|
| Payroll failure | [payroll-runbook.md](./payroll-runbook.md) |
| DB migration | [database-migration.md](./database-migration.md) |
| Incident response | [incident-response.md](./incident-response.md) |
| Outbox stuck | [outbox-recovery.md](./outbox-recovery.md) |
| Dead letter | [dead-letter-events.md](./dead-letter-events.md) |
| Tenant onboarding | [tenant-onboarding.md](./tenant-onboarding.md) |
| Rollback | [rollback-procedure.md](./rollback-procedure.md) |
