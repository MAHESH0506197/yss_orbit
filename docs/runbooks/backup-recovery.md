# YSS Orbit — Backup & Recovery Procedures

> **RPO (Recovery Point Objective)**: 1 hour (hourly DB snapshots)
> **RTO (Recovery Time Objective)**: 4 hours (full restore from backup)
> **Backup retention**: 30 days (daily), 12 months (monthly)

---

## 1. Database Backup Strategy

### Automated Backups

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| WAL archiving | Continuous | 7 days | S3 / GCS |
| Full snapshot | Daily (2 AM IST) | 30 days | S3 / GCS |
| Monthly archive | 1st of month | 12 months | Cold storage |

### PostgreSQL WAL Configuration

```ini
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://yss-orbit-backups/wal/%f'
max_wal_senders = 5
wal_keep_size = 1GB
```

### Daily Full Backup Script

```bash
#!/bin/bash
# /opt/scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="yss_orbit_prod"
BACKUP_DIR="/tmp/db_backups"
S3_BUCKET="s3://yss-orbit-backups/daily"

mkdir -p "$BACKUP_DIR"

# Create compressed dump
pg_dump \
  --host="$DB_HOST" \
  --port=5432 \
  --username="$DB_USER" \
  --no-password \
  --format=custom \
  --compress=9 \
  --file="$BACKUP_DIR/${DB_NAME}_${DATE}.dump" \
  "$DB_NAME"

# Upload to S3
aws s3 cp \
  "$BACKUP_DIR/${DB_NAME}_${DATE}.dump" \
  "$S3_BUCKET/${DB_NAME}_${DATE}.dump" \
  --storage-class STANDARD_IA

# Verify upload
aws s3 ls "$S3_BUCKET/${DB_NAME}_${DATE}.dump"

# Cleanup local
rm "$BACKUP_DIR/${DB_NAME}_${DATE}.dump"

echo "Backup complete: ${DB_NAME}_${DATE}.dump"
```

**Cron schedule** (runs as `postgres` user):
```cron
0 2 * * * /opt/scripts/backup-db.sh >> /var/log/yss_orbit/backup.log 2>&1
```

---

## 2. Restore Procedures

### 2.1 Point-in-Time Recovery (PITR)

Use when: Data corruption, accidental deletion, ransomware.

```bash
# Step 1: Stop the application
systemctl stop gunicorn
systemctl stop celery
systemctl stop celery-beat

# Step 2: Identify the target time
# (time just before the incident occurred)
TARGET_TIME="2026-06-12 10:30:00 IST"  # Convert to UTC

# Step 3: Download base backup from S3
aws s3 cp \
  s3://yss-orbit-backups/daily/yss_orbit_prod_20260612_020000.dump \
  /tmp/restore_base.dump

# Step 4: Restore to a new database first (for verification)
createdb yss_orbit_restore
pg_restore \
  --host=localhost \
  --username=postgres \
  --dbname=yss_orbit_restore \
  --no-acl \
  --no-owner \
  /tmp/restore_base.dump

# Step 5: Apply WAL to reach target time
# (configure recovery.conf for the target_time)
# recovery_target_time = '2026-06-12 05:00:00 UTC'

# Step 6: Verify data integrity
psql -d yss_orbit_restore -c "SELECT COUNT(*) FROM hrms_employee WHERE is_deleted=FALSE;"
psql -d yss_orbit_restore -c "SELECT COUNT(*) FROM payroll_payslip WHERE status='LOCKED';"

# Step 7: If verified, rename databases
psql -c "ALTER DATABASE yss_orbit_prod RENAME TO yss_orbit_prod_bad"
psql -c "ALTER DATABASE yss_orbit_restore RENAME TO yss_orbit_prod"

# Step 8: Restart application
systemctl start gunicorn
systemctl start celery
systemctl start celery-beat
```

### 2.2 Single Table Recovery

Use when: Accidentally deleted records in a specific table.

```bash
# Restore specific table from backup
pg_restore \
  --host=localhost \
  --username=postgres \
  --dbname=yss_orbit_prod \
  --table=hrms_employee \
  /tmp/restore_base.dump

# Note: This will INSERT all records from backup.
# Use with caution - may create duplicates.
# Prefer using the soft-delete restore API instead:
# POST /api/v1/hrms/employees/{id}/restore/
```

### 2.3 Quick Recovery: Soft-Delete Restore

For accidentally soft-deleted records (most common case):

```python
# Django shell restore
from apps.hrms.models import Employee

# Restore a single employee
emp = Employee.all_objects.get(id='<uuid>')  # includes deleted
emp.is_deleted = False
emp.deleted_at = None
emp.deleted_by_id = None
emp.is_active = True
emp.save()

# Restore multiple (e.g., accidental bulk delete)
Employee.all_objects.filter(
    business_unit_id='<bu_uuid>',
    is_deleted=True,
    deleted_at__gte='2026-06-12 10:00:00'  # time of incident
).update(is_deleted=False, deleted_at=None, deleted_by_id=None, is_active=True)
```

---

## 3. Redis Backup & Recovery

Redis is used for: API rate limiting, Celery broker, session cache.

**Note**: Redis is ephemeral in this architecture. On failure, the system degrades gracefully:
- Sessions: Users re-login (JWT cookies remain valid)
- Celery: Tasks retry automatically on worker restart
- Rate limits: Reset on Redis restart (acceptable)

### Redis Persistence Configuration

```ini
# redis.conf
save 900 1       # After 900 sec if at least 1 key changed
save 300 10      # After 300 sec if at least 10 keys changed
save 60 10000    # After 60 sec if at least 10000 keys changed
appendonly yes
appendfsync everysec
dir /var/lib/redis
dbfilename dump.rdb
```

### Redis Recovery

```bash
# If Redis lost data (restart)
systemctl restart redis

# Verify Celery reconnects
celery -A yss_orbit inspect ping

# Re-queue stuck tasks if needed
celery -A yss_orbit purge  # Nuclear: clear all queues
celery -A yss_orbit worker --loglevel=info  # Restart workers
```

---

## 4. File Storage Backup

User-uploaded files (logos, documents, profile photos) are stored in S3/GCS.

### S3 Cross-Region Replication

```bash
# Enable replication on the primary bucket
aws s3api put-bucket-replication \
  --bucket yss-orbit-uploads-primary \
  --replication-configuration file://replication-config.json
```

**replication-config.json:**
```json
{
  "Role": "arn:aws:iam::ACCOUNT:role/S3ReplicationRole",
  "Rules": [{
    "Status": "Enabled",
    "Destination": {
      "Bucket": "arn:aws:s3:::yss-orbit-uploads-backup",
      "StorageClass": "STANDARD_IA"
    }
  }]
}
```

---

## 5. Disaster Recovery Scenarios

### Scenario A: Database Server Failure

| Step | Action | ETA |
|------|--------|-----|
| 1 | Detect failure via health check alert | 0 min |
| 2 | Promote read replica to primary | 15 min |
| 3 | Update DNS / connection string | 10 min |
| 4 | Verify application connects | 10 min |
| 5 | Notify users of any data gap | 5 min |
| **Total** | | **~40 min** |

### Scenario B: Application Server Failure

| Step | Action | ETA |
|------|--------|-----|
| 1 | Auto-scaling launches new instance | 3 min |
| 2 | Load balancer routes traffic | 2 min |
| 3 | Application health check passes | 2 min |
| **Total** | | **~7 min** (if auto-scaling configured) |

### Scenario C: Full Region Failure

| Step | Action | ETA |
|------|--------|-----|
| 1 | Fail over DNS to DR region | 10 min |
| 2 | Restore DB from last S3 snapshot | 45 min |
| 3 | Start application stack in DR | 20 min |
| 4 | Verify all services | 15 min |
| **Total** | | **~90 min** |

---

## 6. Backup Verification (Monthly Test)

Run the first Sunday of every month:

```bash
#!/bin/bash
# /opt/scripts/verify-backup.sh

# 1. Download last night's backup
LATEST=$(aws s3 ls s3://yss-orbit-backups/daily/ | sort | tail -1 | awk '{print $4}')
aws s3 cp "s3://yss-orbit-backups/daily/$LATEST" /tmp/verify.dump

# 2. Restore to test DB
createdb yss_orbit_test_restore 2>/dev/null || true
dropdb yss_orbit_test_restore && createdb yss_orbit_test_restore
pg_restore --dbname=yss_orbit_test_restore /tmp/verify.dump

# 3. Run sanity checks
psql -d yss_orbit_test_restore -c "
  SELECT
    (SELECT COUNT(*) FROM hrms_employee) as employees,
    (SELECT COUNT(*) FROM payroll_payslip) as payslips,
    (SELECT COUNT(*) FROM auth_user) as users;
"

# 4. Clean up
dropdb yss_orbit_test_restore
rm /tmp/verify.dump

echo "Backup verification complete for: $LATEST"
```

**Document results in**: `docs/maintenance/backup-verification-log.md`

---

## 7. Data Retention Policy

| Data Type | Retention | Basis |
|-----------|-----------|-------|
| Employee records (active) | Indefinite | Operational |
| Employee records (terminated) | 7 years post-exit | Indian Labour Law |
| Payslips | 7 years | IT Act 1961 |
| Audit logs | 5 years | DPDP Act 2023 |
| Application logs | 90 days | Operational |
| DB backups (daily) | 30 days | Operational |
| DB backups (monthly) | 12 months | Compliance |
| Uploaded documents | 7 years | Indian Labour Law |

### Automated Data Cleanup (Celery Beat)

```python
# Scheduled task in apps/core/tasks.py
@shared_task
def cleanup_expired_data():
    """Run monthly - cleans up data past retention period."""
    from datetime import timedelta
    from django.utils import timezone
    cutoff = timezone.now() - timedelta(days=90)

    # Clean old application logs (keep audit logs separately)
    from apps.audit.models import AuditLog
    # Note: AuditLog is NEVER deleted - only archived

    # Clean expired notification logs (90 days)
    from apps.notifications.models import NotificationLog
    NotificationLog.objects.filter(created_at__lt=cutoff).delete()
```
