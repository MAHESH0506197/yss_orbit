#!/usr/bin/env bash
# yss_orbit\infra\scripts\migrate.sh
set -e

echo "Running database migrations..."
cd /app
alembic upgrade head
echo "Database migrations applied successfully."
