# YSS Orbit — Deployment Checklist

> **Audience:** DevOps, Release engineers
> **Last Updated:** June 2026

---

## 1. Pre-Deployment Checklist

Run **before every production deployment**, no exceptions.

```bash
# All checks must pass (0 issues) before deploy proceeds
python manage.py check --deploy

# All migrations applied
python manage.py showmigrations | grep '\[ \]'
# Expected: no output (all applied)

# Static files collected
python manage.py collectstatic --noinput

# Full test suite green
python -m pytest apps/payroll/tests/ apps/hrms/tests/ -v --tb=short -q
# Expected: X passed, 0 failed, 0 errors
```

---

## 2. Environment Variables (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `DJANGO_SETTINGS_MODULE` | Settings file | `config.settings.production` |
| `SECRET_KEY` | Django secret key | 50+ random chars |
| `DATABASE_URL` | PostgreSQL connection | `postgres://user:pass@host:5432/db` |
| `REDIS_URL` | Redis/Celery broker | `redis://:pass@host:6379/0` |
| `ALLOWED_HOSTS` | Comma-separated hostnames | `api.yssorbit.com` |
| `CORS_ALLOWED_ORIGINS` | Frontend origin | `https://app.yssorbit.com` |
| `EMAIL_HOST` | SMTP host | `smtp.sendgrid.net` |
| `EMAIL_HOST_USER` | SMTP user | `apikey` |
| `EMAIL_HOST_PASSWORD` | SMTP password / API key | *(from secrets vault)* |
| `AWS_ACCESS_KEY_ID` | S3 media storage | *(from IAM role)* |
| `AWS_SECRET_ACCESS_KEY` | S3 media storage | *(from IAM role)* |
| `AWS_STORAGE_BUCKET_NAME` | S3 bucket | `yss-orbit-media-prod` |
| `SENTRY_DSN` | Error tracking | `https://...@sentry.io/...` |
| `MAINTENANCE_MODE` | Emergency flag | `false` |

> [!CAUTION]
> Never commit secrets to version control. Use AWS Secrets Manager or Vault.

---

## 3. Database Migration Procedure

```bash
# 1. Backup before any migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Check what will run
python manage.py migrate --plan

# 3. Apply migrations
python manage.py migrate

# 4. Verify
python manage.py showmigrations | grep '\[ \]'
# Expected: empty output
```

> [!WARNING]
> Never run `migrate` without a backup. Always test migrations on staging first.

### Known Safe / No-Downtime Migrations
- Adding new columns with `null=True, blank=True`
- Adding new indexes (use `CREATE INDEX CONCURRENTLY` for large tables — see `DATABASE.md`)
- Adding new models

### Migrations Requiring Downtime
- Renaming columns (use `db_column` alias approach instead)
- Changing `unique=True` on populated columns
- Dropping columns (soft-delete via `is_archived` first, drop in next cycle)

---

## 4. Docker / Kubernetes Deployment

```bash
# Build image
docker build -t yss-orbit-backend:$GIT_SHA .

# Run migrations in init container (already in k8s manifest)
kubectl apply -f infra/kubernetes/backend-migration-job.yaml

# Roll out new version
kubectl set image deployment/yss-orbit-backend \
  backend=yss-orbit-backend:$GIT_SHA

# Monitor rollout
kubectl rollout status deployment/yss-orbit-backend

# Rollback if needed
kubectl rollout undo deployment/yss-orbit-backend
```

---

## 5. Post-Deployment Smoke Tests

```bash
# Health check
curl -sf https://api.yssorbit.com/api/v1/health/ | python -m json.tool

# Auth working
curl -sf https://api.yssorbit.com/api/v1/auth/token/ \
  -d '{"username":"smoke_test_user","password":"..."}' \
  -H "Content-Type: application/json"

# Celery workers alive
celery -A config inspect ping

# Key API endpoints return 200/401 (not 500)
for endpoint in \
  /api/v1/hrms/employees/ \
  /api/v1/hrms/attendance/ \
  /api/v1/hrms/leave/requests/ \
  /api/v1/payroll/runs/ \
  /api/v1/notifications/inbox/
do
  status=$(curl -o /dev/null -sw "%{http_code}" https://api.yssorbit.com$endpoint \
    -H "Authorization: Bearer $TEST_TOKEN")
  echo "$endpoint → $status"
done
```

Expected: all return `200` or `401` (never `500`).

---

## 6. Rollback Procedure

```bash
# Kubernetes — roll back to previous image
kubectl rollout undo deployment/yss-orbit-backend

# If migrations ran — restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Verify system health after rollback
python manage.py check
```

---

## 7. Celery Worker Deployment

```bash
# Celery workers are separate deployments
kubectl set image deployment/yss-orbit-celery-worker \
  worker=yss-orbit-backend:$GIT_SHA

kubectl set image deployment/yss-orbit-celery-beat \
  beat=yss-orbit-backend:$GIT_SHA

# Always restart beat after code changes (stale schedules)
kubectl rollout restart deployment/yss-orbit-celery-beat
```
