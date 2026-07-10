# YSS Orbit — Production Operations Checklist

> **Use this document before every major deployment, payroll cycle, and monthly maintenance window.**
> **Owner**: Platform Engineering + HRMS Ops team

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved: `npm run typecheck`
- [ ] ESLint passing: `npm run lint`
- [ ] Unit tests passing: `npm test -- --watchAll=false`
- [ ] Backend tests passing: `python manage.py test`
- [ ] `python manage.py check` returns 0 issues

### Database
- [ ] All migrations applied: `python manage.py showmigrations | grep '[ ]'`
- [ ] Migration is reversible (rollback tested)
- [ ] No blocking DDL on high-traffic tables
- [ ] DB backup taken before deployment

### Infrastructure
- [ ] Celery workers healthy: `celery -A yss_orbit inspect ping`
- [ ] Redis connected: `redis-cli ping`
- [ ] Environment variables verified (check `.env.production`)
- [ ] SSL certificate valid (expiry > 30 days)
- [ ] Disk space > 20%: `df -h`

---

## Monthly Payroll Checklist

### Week 3 of Month (24th–26th)
- [ ] Review any salary structure changes pending this month
- [ ] Verify all employee bank accounts are updated
- [ ] Confirm all new joiners have salary structures assigned
- [ ] Review IT declarations — any changes from employees?
- [ ] Check all exit employees — FnF required?

### 25th — Lock Attendance
- [ ] Lock attendance for all business units
- [ ] Verify: No employee has empty attendance for the month
- [ ] Resolve: Any missed punch / exceptional attendance
- [ ] Confirm: Leave applications approved/rejected for the month

### 26th–27th — Payroll Run
- [ ] Run payroll: POST `/api/v1/payroll/runs/`
- [ ] Wait for completion (async for large BUs)
- [ ] Download salary register: check gross, net, TDS
- [ ] Variance check: flag employees with > 20% salary change
- [ ] Review: Any employee with ₹0 net pay?
- [ ] Verify: PT applied correctly by state
- [ ] Verify: TDS computed for all employees

### 28th — Review & Approve
- [ ] Finance manager review complete
- [ ] Approve payroll: POST `/api/v1/payroll/runs/{id}/approve/`
- [ ] Lock payroll: POST `/api/v1/payroll/runs/{id}/lock/`
- [ ] Download bank statement
- [ ] Upload to corporate net banking for NEFT

### 1st of Next Month — Statutory Filing Prep
- [ ] Export PF register (due 7th)
- [ ] Export ESI register (due 15th)
- [ ] Compile PT by state (due end of month)
- [ ] Prepare TDS challan (due 7th)

---

## Weekly Health Check

Run every Monday:

```bash
#!/bin/bash
echo "=== YSS Orbit Weekly Health Check ==="

# 1. Backend health
echo "[1] Backend health..."
curl -sf https://api.yss-orbit.com/api/v1/health/ || echo "⚠️ BACKEND UNHEALTHY"

# 2. Pending migrations
echo "[2] Pending migrations..."
python manage.py showmigrations | grep '[ ]' && echo "⚠️ UNAPPLIED MIGRATIONS" || echo "✅ All migrations applied"

# 3. Failed payroll runs
echo "[3] Failed payroll runs..."
python manage.py shell -c "
from apps.payroll.models import PayrollRun
failed = PayrollRun.objects.filter(status='FAILED').count()
print(f'Failed runs: {failed}')
if failed > 0: print('⚠️ REQUIRES ATTENTION')
"

# 4. Celery workers
echo "[4] Celery workers..."
celery -A yss_orbit inspect ping 2>/dev/null | grep -c "pong" || echo "⚠️ NO CELERY WORKERS"

# 5. Disk space
echo "[5] Disk space..."
df -h / | awk 'NR==2{if($5+0 > 80) print "⚠️ DISK CRITICAL: " $5; else print "✅ Disk OK: " $5}'

echo "=== Health check complete ==="
```

---

## Environment Variables Reference

### Backend (.env.production)

```bash
# Django
DJANGO_SECRET_KEY=<50+ char random string>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=api.yss-orbit.com,<IP>
DJANGO_SETTINGS_MODULE=config.settings.production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/yss_orbit_prod
DB_CONN_MAX_AGE=60
DB_POOL_SIZE=20

# Cache / Celery
REDIS_URL=redis://:password@host:6379/0
CELERY_BROKER_URL=redis://:password@host:6379/1
CELERY_RESULT_BACKEND=redis://:password@host:6379/2

# JWT
JWT_SECRET_KEY=<separate secret from Django>
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# Email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=<sendgrid API key>
DEFAULT_FROM_EMAIL=noreply@yss-orbit.com

# Storage
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_STORAGE_BUCKET_NAME=yss-orbit-uploads-prod
AWS_S3_REGION_NAME=ap-south-1

# Monitoring
SENTRY_DSN=<sentry DSN>
LOG_LEVEL=WARNING
```

### Frontend (.env.production)

```bash
VITE_API_BASE_URL=https://api.yss-orbit.com
VITE_APP_VERSION=1.0.0
VITE_SENTRY_DSN=<sentry DSN>
VITE_POSTHOG_KEY=<posthog key>
```

---

## Scaling Guidelines

### When to Scale

| Metric | Threshold | Action |
|--------|-----------|--------|
| API p95 > 500ms | Sustained 5 min | Add gunicorn workers |
| CPU > 80% | Sustained 10 min | Scale backend |
| Celery queue > 100 | | Add Celery workers |
| DB connections > 80% | | Add PgBouncer/scale DB |
| Redis memory > 80% | | Scale Redis |

### Quick Scale Commands

```bash
# Scale gunicorn workers (in systemd service)
# Edit /etc/systemd/system/gunicorn.service
# --workers=$(( 2 * $(nproc) + 1 ))
systemctl daemon-reload && systemctl restart gunicorn

# Scale Celery (Docker/K8s)
docker service scale yss_orbit_celery=4

# Emergency: restart all services
systemctl restart gunicorn celery celery-beat nginx
```

---

## Key URLs

| Service | URL | Auth |
|---------|-----|------|
| API | `https://api.yss-orbit.com` | JWT |
| Admin | `https://api.yss-orbit.com/admin/` | Django superuser |
| Health | `https://api.yss-orbit.com/api/v1/health/` | Public |
| Frontend | `https://app.yss-orbit.com` | JWT cookie |
| Celery Flower | `http://internal:5555` | Basic auth |
| PgAdmin | `http://internal:5050` | DB credentials |

---

## Runbook Index

| Scenario | Document |
|----------|----------|
| Payroll operations | [payroll-runbook.md](./payroll-runbook.md) |
| Monitoring & alerts | [monitoring-alerts.md](./monitoring-alerts.md) |
| Backup & recovery | [backup-recovery.md](./backup-recovery.md) |
| Data privacy (DPDP) | [../governance/hrms-data-privacy.md](../governance/hrms-data-privacy.md) |
| Incident response | [incident-response.md](./incident-response.md) |
| DB migration | [database-migration.md](./database-migration.md) |
| Tenant onboarding | [tenant-onboarding.md](./tenant-onboarding.md) |
| Rollback | [rollback-procedure.md](./rollback-procedure.md) |
| Dead letter events | [dead-letter-events.md](./dead-letter-events.md) |
| Outbox recovery | [outbox-recovery.md](./outbox-recovery.md) |
| Scaling | [scaling-guide.md](./scaling-guide.md) |
