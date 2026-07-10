# YSS Orbit — Incident Response Playbook

> **Audience:** On-call SRE, Engineering leads
> **Revision:** v1.0 — June 2026

---

## 1. Incident Severity Levels

| Level | Definition | Response Time | Examples |
|-------|-----------|--------------|---------|
| **P0 — Critical** | Full outage, data loss, payroll corruption, security breach | 15 minutes | DB down, payroll run corrupted, data leak |
| **P1 — High** | Major feature unavailable, significant data integrity risk | 1 hour | ESS inaccessible, Celery dead, payroll stuck |
| **P2 — Medium** | Degraded performance, non-critical feature broken | 4 hours | Slow analytics, notification queue backed up |
| **P3 — Low** | Cosmetic, minor, no user impact | Next sprint | UI text errors, stale docs |

---

## 2. Incident Response Steps

### Step 1 — Declare the Incident
```
#yss-orbit-incidents (Slack)
[P{X}] INCIDENT DECLARED — {Brief description}
Affected: {component}
Impact: {user/business impact}
IC: {Incident Commander name}
Started: {time IST}
```

### Step 2 — Assess & Contain
- Do NOT try to fix while assessing — gather information first
- Check dashboards: Sentry, CloudWatch/Prometheus, Celery Flower
- Identify blast radius (how many tenants/users affected)

### Step 3 — Mitigate
- Apply the appropriate playbook below (§3)
- Enable maintenance mode if needed: set `MAINTENANCE_MODE=true`

### Step 4 — Resolve & Verify
- Confirm fix with smoke tests
- Monitor for 15 minutes post-fix before declaring resolved

### Step 5 — Post-Incident Review
- Required for all P0 and P1 incidents
- Due within 48 hours of resolution
- Template: `docs/adr/incident_review_template.md`

---

## 3. Incident Playbooks

---

### 🔴 P0-A: Database Down / Unreachable

**Symptoms:** `django.db.utils.OperationalError: could not connect to server`

**Triage:**
```bash
# Test connectivity
pg_isready -h $DB_HOST -p 5432

# Check RDS status (AWS)
aws rds describe-db-instances --db-instance-identifier yss-orbit-prod \
  --query 'DBInstances[0].DBInstanceStatus'
```

**Mitigation:**
```bash
# 1. Check if it's a connection pool exhaustion issue
# In pgBouncer logs:
tail -100 /var/log/pgbouncer/pgbouncer.log | grep "no more connections"

# If pool exhausted — emergency reset
kill -HUP $(pgrep pgbouncer)

# 2. If RDS is rebooting, wait for automatic recovery (typically < 5 min for RDS)
# Set maintenance page

# 3. If RDS is down — failover to replica
aws rds failover-db-cluster --db-cluster-identifier yss-orbit-cluster

# 4. Update DATABASE_URL to new primary endpoint
```

**Escalate if:** DB down > 15 minutes — page AWS Support (Enterprise).

---

### 🔴 P0-B: Payroll Run Corruption

**Symptoms:** Payroll run in PROCESSING for > 30 minutes, zero/negative payslips, mismatched totals.

**Triage:**
```bash
python manage.py shell -c "
from apps.payroll.models import PayrollRun
run = PayrollRun.objects.filter(month=6, year=2026).latest('created_at')
print(f'Status: {run.status}, Employees: {run.total_employees}')
print(f'Total Net: {run.total_net}, Gross: {run.total_gross}')
payslips = run.payslips.all()
print(f'Payslips created: {payslips.count()}')
print(f'Zero net payslips: {payslips.filter(net_salary__lte=0).count()}')
"
```

**Mitigation:**
```bash
# 1. If status stuck at PROCESSING — mark as FAILED to unblock
python manage.py shell -c "
from apps.payroll.models import PayrollRun
run = PayrollRun.objects.get(id='RUN-UUID')
run.status = PayrollRun.Status.FAILED
run.save()
print('Marked as FAILED')
"

# 2. Delete corrupt payslips for the run
python manage.py shell -c "
from apps.payroll.models import Payslip, PayrollRun
run = PayrollRun.objects.get(id='RUN-UUID')
count = Payslip.objects.filter(payroll_run=run).delete()
print(f'Deleted {count} payslips')
"

# 3. Fix the underlying issue (check Sentry for the error)

# 4. Re-run payroll (run is now in FAILED state — can regenerate)
```

> [!CAUTION]
> Never manually edit payslip salary figures. Always re-run via `PayrollService.generate_monthly_payroll()` after fixing the root cause.

---

### 🔴 P0-C: Security Breach / Data Leak Suspected

**Immediate actions (within 15 minutes):**

```bash
# 1. Revoke ALL active JWT tokens immediately
python manage.py shell -c "
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
count = OutstandingToken.objects.all().delete()
print(f'Revoked {count} tokens')
"

# 2. Rotate SECRET_KEY (generates new tokens, invalidates all sessions)
# Update AWS Secrets Manager, redeploy all pods
kubectl rollout restart deployment/yss-orbit-backend

# 3. Rotate database password
aws rds modify-db-instance \
  --db-instance-identifier yss-orbit-prod \
  --master-user-password NEW_STRONG_PASSWORD

# 4. Block suspicious IPs at Nginx/WAF level
# (add to /etc/nginx/conf.d/blocked.conf or AWS WAF)

# 5. Preserve logs for forensics — DO NOT clear logs
aws s3 cp /var/log/nginx/access.log s3://yss-orbit-forensics/incident-$(date +%Y%m%d)/
```

**Notify (within 72 hours for GDPR):**
- Internal DPO
- Affected tenants
- Regulatory authority (if personal data of EU subjects was involved)

---

### 🟡 P1-A: Celery Workers Dead

**Symptoms:** Background tasks not processing, payslip notifications not sent, analytics stale.

**Triage:**
```bash
# Check if workers are alive
celery -A config inspect ping
# Expected: {'worker@hostname': {'ok': 'pong'}}
# If empty: workers are dead

# Check Celery logs
kubectl logs deployment/yss-orbit-celery-worker --tail=50

# Check task queue depth
redis-cli -h $REDIS_HOST LLEN celery
```

**Mitigation:**
```bash
# Restart Celery workers
kubectl rollout restart deployment/yss-orbit-celery-worker

# Verify after restart (wait 30 seconds)
sleep 30
celery -A config inspect ping

# If tasks stuck in PENDING — retry them
python manage.py shell -c "
from celery.result import AsyncResult
# Check a specific task
r = AsyncResult('TASK-ID')
print(r.state, r.info)
"
```

---

### 🟡 P1-B: API 500 Error Rate Spike

**Symptoms:** Sentry showing spike in 500 errors, users reporting failures.

**Triage:**
```bash
# Top errors in last 30 minutes
# Check Sentry: Project → Issues → Sort by frequency → Filter last 30 min

# Check Django error logs
kubectl logs deployment/yss-orbit-backend --tail=100 | grep ERROR

# Check p95 latency
# CloudWatch: ApplicationELB → TargetResponseTime P95
```

**Mitigation:**
```bash
# If it's a deployment-related regression — rollback
kubectl rollout undo deployment/yss-orbit-backend

# If it's a specific endpoint — temporarily disable via feature flag
# config/settings/production.py → DISABLED_ENDPOINTS = ['/api/v1/analytics/']
```

---

### 🟡 P1-C: Leave Approval Stuck

**Symptoms:** Leave requests stuck in SUBMITTED/MANAGER_APPROVED for > 24 hours.

**Triage:**
```bash
python manage.py shell -c "
from apps.hrms.models import LeaveRequest
from django.utils import timezone
from datetime import timedelta
stale = LeaveRequest.objects.filter(
    status__in=['SUBMITTED', 'MANAGER_APPROVED'],
    created_at__lt=timezone.now() - timedelta(hours=24)
)
print(f'Stale requests: {stale.count()}')
for r in stale[:5]:
    print(f'  {r.employee_id}: {r.status} since {r.created_at}')
"
```

**Mitigation:**
- Notify the approving manager via direct message
- If manager is unavailable, HR admin can force-approve via `LeaveService.approve_leave_hr()`

---

## 4. Runbook Quick Reference

| Symptom | Playbook |
|---------|---------|
| DB unreachable | P0-A |
| Payroll stuck/corrupt | P0-B |
| Security breach | P0-C |
| Celery not processing | P1-A |
| 500 error spike | P1-B |
| Leave stuck | P1-C |
| Slow analytics | Wait for next `generate_analytics_snapshot_task` run or trigger manually |
| Notifications not sent | Check Celery + SMTP credentials in Secrets Manager |
| Attendance records wrong | Check `AttendanceService._recalculate_record()` logs via Sentry |

---

## 5. Communication Templates

### Incident declared
```
[{SEVERITY}] INCIDENT #{number}: {title}
Status: INVESTIGATING
Impact: {description of user impact}
ETA: {estimated resolution time or "unknown"}
Updates: every 30 minutes or on status change
```

### Resolved
```
[RESOLVED] INCIDENT #{number}: {title}
Root Cause: {brief description}
Fix Applied: {what was done}
Duration: {start time} — {end time} ({total minutes})
Post-Incident Review: {link}
```
