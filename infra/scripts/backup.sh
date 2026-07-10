#!/usr/bin/env bash
# yss_orbit\infra\scripts\backup.sh
set -e

# Production backup script for Postgres
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME=${POSTGRES_DB:-yss_orbit}
DB_USER=${POSTGRES_USER:-postgres}

mkdir -p "$BACKUP_DIR"

echo "Starting backup for database $DB_NAME at $TIMESTAMP"
pg_dump -U "$DB_USER" -F c -d "$DB_NAME" -f "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"
echo "Backup completed successfully: $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"
