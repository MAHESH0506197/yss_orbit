# YSS Orbit — Scaling Guide

> **Audience:** DevOps, Backend engineers, SRE
> **Covers:** Celery horizontal scaling, async payroll runs, DB read replicas, caching strategy, CDN

---

## 1. Current Baseline (Launch Configuration)

| Component | Count | Spec |
|-----------|-------|------|
| Django API (Gunicorn) | 2 pods | 2 vCPU, 4GB RAM each |
| Celery Worker | 2 pods | 2 vCPU, 4GB RAM each |
| Celery Beat | 1 pod | 1 vCPU, 1GB RAM |
| PostgreSQL (RDS) | 1 primary | db.t3.large (2 vCPU, 8GB RAM) |
| Redis | 1 instance | cache.t3.micro |
| Nginx | 1 instance (load balancer) | — |

**Supported load at launch:** ~500 concurrent users, payroll for up to 10,000 employees per run.

---

## 2. Celery Horizontal Scaling

### When to Scale Out
- Celery task queue depth > 500 tasks consistently for > 5 minutes
- Payroll run taking > 15 minutes for 1,000 employees
- `celery inspect active` shows all workers at 100% concurrency

### Adding More Workers

```bash
# Kubernetes: scale Celery worker deployment
kubectl scale deployment yss-orbit-celery-worker --replicas=5

# Docker Compose
docker-compose up --scale celery_worker=5
```

### Worker Specialisation (Queues)

As load grows, split workers by queue type to prevent payroll tasks from being blocked by analytics:

```python
# config/celery.py — task routing
CELERY_TASK_ROUTES = {
    # High-priority: payroll generation (dedicated workers)
    'apps.payroll.tasks.payroll_tasks.generate_payroll_task': {'queue': 'payroll'},
    'apps.payroll.tasks.payroll_tasks.notify_payslip_available_task': {'queue': 'payroll'},

    # Medium-priority: notifications
    'apps.notifications.tasks.dispatch_notification_task': {'queue': 'notifications'},

    # Low-priority: analytics and archival (can wait)
    'apps.hrms.tasks.analytics_tasks.*': {'queue': 'analytics'},
    'apps.payroll.tasks.payroll_tasks.archive_payroll_runs_task': {'queue': 'analytics'},
}
```

```bash
# Launch dedicated queue workers
celery -A config worker --queues=payroll --concurrency=8 --loglevel=info &
celery -A config worker --queues=notifications --concurrency=4 --loglevel=info &
celery -A config worker --queues=analytics --concurrency=2 --loglevel=info &
```

---

## 3. Async Payroll Runs (Large Tenants)

For tenants with > 5,000 employees, the synchronous `PayrollService.generate_monthly_payroll()` will time out. Switch to async chunked processing:

### Phase 1: Chunked async (up to 50,000 employees)

```python
# apps/payroll/tasks/payroll_tasks.py
@shared_task(queue='payroll', bind=True, max_retries=3)
def generate_payroll_chunk_task(self, tenant_id: str, month: int, year: int,
                                 employee_ids: list[str], run_id: str):
    """Process a chunk of employees for a payroll run."""
    from apps.payroll.services.payroll_service import PayrollService
    PayrollService.process_employee_chunk(
        tenant_id=UUID(tenant_id),
        run_id=UUID(run_id),
        employee_ids=[UUID(e) for e in employee_ids],
        month=month, year=year
    )

@shared_task(queue='payroll')
def generate_payroll_async(tenant_id: str, month: int, year: int, run_by_id: str):
    """Fan-out payroll generation across chunks of 500 employees each."""
    from apps.hrms.models import Employee
    from apps.payroll.models import PayrollRun
    import uuid

    bu_id = uuid.UUID(tenant_id)
    employee_ids = list(
        Employee.objects.filter(
            business_unit_id=bu_id,
            employment_status=Employee.EmploymentStatus.ACTIVE
        ).values_list('id', flat=True)
    )

    # Create run in PROCESSING state
    run = PayrollRun.objects.create(
        business_unit_id=bu_id, month=month, year=year,
        status=PayrollRun.Status.PROCESSING, run_by_id=uuid.UUID(run_by_id)
    )

    # Fan out in chunks of 500
    chunk_size = 500
    group_tasks = group(
        generate_payroll_chunk_task.s(
            tenant_id, month, year,
            [str(e) for e in employee_ids[i:i+chunk_size]],
            str(run.id)
        )
        for i in range(0, len(employee_ids), chunk_size)
    )

    # Finalise after all chunks complete
    chord(group_tasks)(finalise_payroll_run_task.s(str(run.id)))
```

### Phase 2: DB read replicas for payroll computation

```python
# When generating payslips, read employee/attendance data from replica
employees = Employee.objects.using('replica').filter(
    business_unit_id=tenant_id,
    employment_status=Employee.EmploymentStatus.ACTIVE
)
# Write payslips to primary only
Payslip.objects.using('default').bulk_create(payslips)
```

---

## 4. Database Scaling

### Connection Limits

| Config | Value |
|--------|-------|
| PostgreSQL `max_connections` | 200 |
| pgBouncer `max_client_conn` | 500 |
| pgBouncer `default_pool_size` | 25 |
| Django `CONN_MAX_AGE` | 0 (required for pgBouncer transaction mode) |

### When to Upgrade Database
- `pg_stat_activity` regularly shows > 150 active connections
- Average query time `pg_stat_statements` > 100ms sustained
- CPU utilisation > 70% sustained

**Upgrade path:**
```
db.t3.large → db.t3.xlarge → db.t3.2xlarge → db.r6g.xlarge (read-optimised)
```

### Read Replica for Reporting

```bash
# Create RDS read replica (AWS CLI)
aws rds create-db-instance-read-replica \
  --db-instance-identifier yss-orbit-prod-replica \
  --source-db-instance-identifier yss-orbit-prod \
  --db-instance-class db.t3.large
```

---

## 5. Redis / Caching Strategy

### Cache Keys

| Cache Key Pattern | TTL | Content |
|-------------------|-----|---------|
| `employee:{bu_id}:{emp_id}` | 5 min | Employee object (frequently read in payroll) |
| `leave_balance:{bu_id}:{emp_id}:{year}` | 10 min | Leave balance summary |
| `pt_slabs:{state_code}` | 24 hours | Professional Tax slabs (rarely change) |
| `salary_structure:{struct_id}` | 30 min | Salary structure components |
| `analytics_snapshot:{bu_id}:{month}:{year}` | 1 hour | Analytics summary |

### Cache Invalidation Rules

```python
# Invalidate employee cache on any update
@receiver(post_save, sender=Employee)
def invalidate_employee_cache(sender, instance, **kwargs):
    cache.delete(f"employee:{instance.business_unit_id}:{instance.id}")

# Invalidate leave balance on approval
@receiver(post_save, sender=LeaveBalance)
def invalidate_leave_cache(sender, instance, **kwargs):
    cache.delete(f"leave_balance:{instance.business_unit_id}:{instance.employee_id}:{instance.year}")
```

---

## 6. API Rate Limiting at Scale

As user count grows, move from Django throttling to **API Gateway** level:

```yaml
# AWS API Gateway Usage Plan
UsagePlan:
  Throttle:
    RateLimit: 1000      # requests per second
    BurstLimit: 2000
  Quota:
    Limit: 1000000       # requests per month per API key
```

---

## 7. Scaling Milestones

| Milestone | Trigger | Action |
|-----------|---------|--------|
| **500 employees** | Default | Current config sufficient |
| **5,000 employees** | Payroll run > 10 min | Async chunked payroll (see §3) |
| **2,000 concurrent users** | API p95 > 1s | Add 2 more Django pods |
| **50,000 attendance records/day** | Query p95 > 200ms | Add `CONCURRENTLY` index on attendance_date |
| **10M attendance records** | Table > 50GB | Partition attendance table by month |
| **10 tenants** | CPU > 70% sustained | Upgrade RDS to db.t3.xlarge + add read replica |
| **50 tenants** | — | Evaluate dedicated DB per tenant (schema isolation) |

---

## 8. Monitoring & Alerting

```yaml
# Recommended CloudWatch/Prometheus alerts
alerts:
  - name: PayrollRunStuck
    condition: payroll_run.status == PROCESSING AND age > 30min
    severity: P1

  - name: CeleryQueueDepth
    condition: celery_queue_length > 500 AND duration > 5min
    severity: P2

  - name: DatabaseConnections
    condition: pg_active_connections > 150
    severity: P2

  - name: APIErrorRate
    condition: http_5xx_rate > 1% AND duration > 2min
    severity: P1

  - name: DiskUsageCritical
    condition: disk_usage > 85%
    severity: P1
```
