# YSS Orbit — Backup & Restore Procedures

> **Audience:** DevOps, SRE, DBA
> **RTO (Recovery Time Objective):** 4 hours
> **RPO (Recovery Point Objective):** 1 hour (continuous WAL archiving)

---

## 1. Backup Schedule

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| Full database dump | Daily at 02:00 IST | 30 days | S3: `s3://yss-orbit-backups/db/daily/` |
| Incremental WAL | Continuous | 7 days | S3: `s3://yss-orbit-backups/db/wal/` |
| Weekly full dump | Sundays at 01:00 IST | 1 year | S3: `s3://yss-orbit-backups/db/weekly/` |
| Media files (S3) | Continuous (S3 versioning) | 90 days of versions | S3: `yss-orbit-media-prod` |
| Django config/secrets | On change | 90 days | AWS Secrets Manager (versioned) |

---

## 2. Automated Backup Script

```bash
#!/bin/bash
# /opt/yss_orbit/scripts/backup_daily.sh
# Runs via cron: 0 2 * * * /opt/yss_orbit/scripts/backup_daily.sh

set -euo pipefail

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/tmp/yss_orbit_backup_${DATE}.dump"
S3_PATH="s3://yss-orbit-backups/db/daily/backup_${DATE}.dump"

echo "[$(date)] Starting backup..."

# Dump in custom format (compressed, parallel restore possible)
pg_dump \
  --format=custom \
  --compress=9 \
  --file="$BACKUP_FILE" \
  "$DATABASE_URL"

echo "[$(date)] Dump complete: $(du -sh $BACKUP_FILE)"

# Upload to S3
aws s3 cp "$BACKUP_FILE" "$S3_PATH" \
  --server-side-encryption aws:kms \
  --sse-kms-key-id "$KMS_KEY_ID"

echo "[$(date)] Uploaded to S3: $S3_PATH"

# Cleanup local file
rm -f "$BACKUP_FILE"

# Remove backups older than 30 days from S3
aws s3 ls s3://yss-orbit-backups/db/daily/ | \
  awk '{print $4}' | \
  while read key; do
    created=$(aws s3api head-object --bucket yss-orbit-backups --key "db/daily/$key" \
      --query 'LastModified' --output text)
    age=$(( ($(date +%s) - $(date -d "$created" +%s)) / 86400 ))
    if [ $age -gt 30 ]; then
      aws s3 rm "s3://yss-orbit-backups/db/daily/$key"
      echo "Deleted old backup: $key (${age} days old)"
    fi
  done

echo "[$(date)] Backup complete."
```

---

## 3. Point-in-Time Recovery (PITR) Setup

Enable WAL archiving in PostgreSQL:

```bash
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://yss-orbit-backups/db/wal/%f'
archive_timeout = 300          # Archive every 5 minutes at minimum
```

**Restore to a specific point in time:**
```bash
# 1. Stop the application (maintenance mode)
kubectl scale deployment yss-orbit-backend --replicas=0

# 2. Restore base backup
aws s3 cp s3://yss-orbit-backups/db/daily/backup_YYYYMMDD.dump /tmp/restore.dump
pg_restore --dbname=postgres --create --clean /tmp/restore.dump

# 3. Configure recovery target
cat > /var/lib/postgresql/data/recovery.conf << EOF
restore_command = 'aws s3 cp s3://yss-orbit-backups/db/wal/%f %p'
recovery_target_time = '2026-06-12 14:30:00 IST'
recovery_target_action = 'promote'
EOF

# 4. Start PostgreSQL — it will replay WAL up to target time
systemctl start postgresql

# 5. Verify data integrity
python manage.py check
python manage.py showmigrations | grep '\[ \]'

# 6. Restart application
kubectl scale deployment yss-orbit-backend --replicas=3
```

---

## 4. Full Database Restore (Disaster Recovery)

```bash
# 1. Provision fresh PostgreSQL instance (RDS or self-managed)
# 2. Create the database
psql -c "CREATE DATABASE yss_orbit_prod;"

# 3. Restore from latest backup
aws s3 cp s3://yss-orbit-backups/db/daily/backup_LATEST.dump /tmp/restore.dump

pg_restore \
  --dbname=yss_orbit_prod \
  --no-owner \
  --no-acl \
  --jobs=4 \
  /tmp/restore.dump

# 4. Verify row counts (sanity check)
psql yss_orbit_prod -c "
SELECT schemaname, tablename, n_live_tup
FROM pg_stat_user_tables
WHERE n_live_tup > 0
ORDER BY n_live_tup DESC
LIMIT 20;
"

# 5. Run Django checks
python manage.py check
python manage.py showmigrations

# 6. Update DATABASE_URL in environment/secrets
# 7. Deploy application pointing to new DB
```

---

## 5. Backup Verification (Monthly Drill)

Run this every month to ensure backups are restorable:

```bash
#!/bin/bash
# /opt/yss_orbit/scripts/verify_backup.sh

set -euo pipefail

# Pull latest backup
LATEST=$(aws s3 ls s3://yss-orbit-backups/db/daily/ | sort | tail -1 | awk '{print $4}')
aws s3 cp "s3://yss-orbit-backups/db/daily/$LATEST" /tmp/verify_restore.dump

# Create temp DB
psql $STAGING_DATABASE_URL -c "DROP DATABASE IF EXISTS orbit_restore_test;"
psql $STAGING_DATABASE_URL -c "CREATE DATABASE orbit_restore_test;"

# Restore
pg_restore --dbname=orbit_restore_test --no-owner --no-acl /tmp/verify_restore.dump

# Run checks against restored DB
DATABASE_URL="postgresql://...orbit_restore_test" python manage.py check

echo "✅ Backup verification PASSED: $LATEST"

# Cleanup
psql $STAGING_DATABASE_URL -c "DROP DATABASE orbit_restore_test;"
rm -f /tmp/verify_restore.dump
```

---

## 6. Media Files Backup

Media files (employee documents, payslip PDFs) are stored in S3 with versioning enabled:

```bash
# Enable versioning (done once at bucket creation)
aws s3api put-bucket-versioning \
  --bucket yss-orbit-media-prod \
  --versioning-configuration Status=Enabled

# Restore a specific file version
aws s3api get-object \
  --bucket yss-orbit-media-prod \
  --key "payslips/2026/06/EMP001_payslip.pdf" \
  --version-id "versionId" \
  restored_file.pdf
```

---

## 7. RTO / RPO Verification

| Scenario | Expected RTO | Tested |
|----------|-------------|--------|
| Single table corruption | 30 min | Monthly |
| Full DB restore | 4 hours | Quarterly |
| Complete DR (new region) | 8 hours | Annually |
