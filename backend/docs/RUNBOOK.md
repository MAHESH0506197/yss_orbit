# YSS Orbit — Operational Runbook

> **Audience:** DevOps, SRE, On-call engineers
> **Scope:** HRMS & Payroll backend (Django + Celery + PostgreSQL)
> **Revision:** v1.0 — June 2026

---

## 1. Service Inventory

| Service | Process | Port | Health Endpoint |
|---------|---------|------|-----------------|
| Django API | `gunicorn config.wsgi` | 8000 | `GET /api/v1/health/` |
| Celery Worker | `celery -A config worker` | — | `celery inspect ping` |
| Celery Beat | `celery -A config beat` | — | Check scheduled task logs |
| PostgreSQL | `postgres` | 5432 | `pg_isready -h localhost` |
| Redis | `redis-server` | 6379 | `redis-cli ping` |
| Nginx (reverse proxy) | `nginx` | 80/443 | `nginx -t` |

---

## 2. Daily Health Checks

Run every morning before business hours:

```bash
# 1. Django system integrity
cd /app/backend
python manage.py check --deploy

# 2. Database connectivity
python manage.py dbshell -c "SELECT 1;"

# 3. Pending migrations (should return None)
python manage.py showmigrations | grep '\[ \]'

# 4. Celery worker alive
celery -A config inspect ping

# 5. Celery Beat scheduled tasks registered
celery -A config inspect scheduled

# 6. Redis connectivity
redis-cli -h $REDIS_HOST ping

# 7. API health endpoint
curl -sf https://api.yssorbit.com/api/v1/health/ | python -m json.tool
```

Expected output for health endpoint:
```json
{ "status": "ok", "db": "ok", "cache": "ok", "version": "4.x.x" }
```

---

## 3. Payroll Month-End Cycle (Critical Path)

Execute in **strict order**. Each step must succeed before proceeding.

### Step 1 — Pre-Run Checklist (T-2 days)
- [ ] All attendance records locked for the period (`is_locked=True`)
- [ ] No pending correction requests older than 48 hours
- [ ] IT declarations submitted by employees
- [ ] PT slabs updated for current financial year
- [ ] Professional Tax state codes verified on all employee records

```bash
# Check unlocked attendance records for a month
python manage.py shell -c "
from apps.hrms.models import AttendanceRecord
import datetime
start = datetime.date(2026, 6, 1)
end = datetime.date(2026, 6, 30)
unlocked = AttendanceRecord.objects.filter(
    attendance_date__range=[start, end],
    is_locked=False
).count()
print(f'Unlocked records: {unlocked}')
"
```

### Step 2 — Generate Payroll Run
```bash
# Via API (recommended — creates audit trail)
curl -X POST https://api.yssorbit.com/api/v1/payroll/runs/generate/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"month": 6, "year": 2026}'

# Via Django shell (emergency only)
python manage.py shell -c "
from apps.payroll.services.payroll_service import PayrollService
import uuid
run = PayrollService.generate_monthly_payroll(
    tenant_id=uuid.UUID('YOUR-BU-UUID'),
    month=6, year=2026
)
print(f'Run: {run.id} Status: {run.status}')
"
```

### Step 3 — Approve Payroll (Two-Step)
```
HR Approval  → POST /api/v1/payroll/runs/{id}/approve/   (role: hr_manager)
Finance Lock → POST /api/v1/payroll/runs/{id}/lock/      (role: finance_admin)
```

### Step 4 — Post-Run Verification
```bash
python manage.py shell -c "
from apps.payroll.models import PayrollRun
run = PayrollRun.objects.filter(month=6, year=2026).latest('created_at')
print(f'Status: {run.status}')
print(f'Employees: {run.total_employees}')
print(f'Total Net: {run.total_net}')
payslips = run.payslips.filter(net_salary__lte=0)
print(f'Zero/Negative payslips: {payslips.count()}')
"
```

### Step 5 — Archive Old Runs
```bash
# Archives LOCKED runs older than 7 years
python manage.py archive_old_payroll_runs --dry-run
python manage.py archive_old_payroll_runs
```

---

## 4. Common Operational Tasks

### 4.1 Force-Lock Attendance Period
```bash
python manage.py shell -c "
from apps.hrms.services.attendance_service import AttendanceService
import uuid, datetime
count = AttendanceService.lock_attendance(
    business_unit_id=uuid.UUID('YOUR-BU-UUID'),
    start_date=datetime.date(2026, 6, 1),
    end_date=datetime.date(2026, 6, 30),
    locked_by_id=uuid.UUID('ADMIN-USER-UUID')
)
print(f'Locked {count} records')
"
```

### 4.2 Re-run Analytics Snapshot
```bash
python manage.py shell -c "
from apps.hrms.services.analytics_snapshot_service import AnalyticsSnapshotService
import uuid
AnalyticsSnapshotService.generate_monthly_snapshot(
    bu_id=uuid.UUID('YOUR-BU-UUID'),
    month=6, year=2026
)
print('Snapshot generated')
"
```

### 4.3 Purge Celery Queue (emergency)
```bash
celery -A config purge
```

### 4.4 Restart a Stuck Celery Worker
```bash
# Graceful restart (drains current tasks)
kill -TERM $(pgrep -f 'celery worker')
sleep 10
celery -A config worker --loglevel=info --concurrency=4 &

# Hard restart (drops in-flight tasks — use only if graceful fails)
kill -KILL $(pgrep -f 'celery worker')
celery -A config worker --loglevel=info &
```

### 4.5 Run All Tests
```bash
cd /app/backend
python -m pytest apps/payroll/tests/ apps/hrms/tests/ -v --tb=short
```

---

## 5. Log Locations

| Log | Path | Retention |
|-----|------|-----------|
| Django application | `/var/log/yss_orbit/django.log` | 30 days |
| Gunicorn access | `/var/log/yss_orbit/gunicorn_access.log` | 14 days |
| Celery worker | `/var/log/yss_orbit/celery_worker.log` | 7 days |
| Celery beat | `/var/log/yss_orbit/celery_beat.log` | 7 days |
| Nginx access | `/var/log/nginx/access.log` | 30 days |
| PostgreSQL | `/var/log/postgresql/postgresql-*.log` | 7 days |

---

## 6. Escalation Matrix

| Severity | Examples | First Responder | Escalate If |
|----------|---------|-----------------|-------------|
| P0 — Critical | Payroll run corrupt, DB down, data loss | On-call SRE | > 15 min no resolution |
| P1 — High | ESS/MSS inaccessible, Celery dead | Backend engineer | > 1 hour |
| P2 — Medium | Slow API (> 2s p95), analytics stale | DevOps | > 4 hours |
| P3 — Low | Docs incorrect, cosmetic bugs | Dev team | Next sprint |

**Emergency contacts:** See `/infra/contacts.yaml` (access-controlled)

---

## 7. Maintenance Window Procedure

1. Post Slack notice in `#yss-orbit-ops` 24 hours before
2. Set `MAINTENANCE_MODE=true` in env — returns 503 with ETA
3. Drain Celery queues: `celery -A config inspect active`
4. Take PostgreSQL backup: see `BACKUP_RESTORE.md`
5. Apply changes
6. Run `python manage.py check --deploy`
7. Run smoke tests
8. Unset `MAINTENANCE_MODE`
9. Monitor error rate for 15 minutes
