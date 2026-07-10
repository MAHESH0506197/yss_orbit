#!/usr/bin/env bash
# yss_orbit\infra\scripts\health_check.sh
set -e

echo "Running system health checks..."

# Check Postgres
if pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-yss_orbit}"; then
    echo "Postgres is healthy."
else
    echo "Postgres is not accessible!"
    exit 1
fi

# Check Redis
if redis-cli ping | grep -q "PONG"; then
    echo "Redis is healthy."
else
    echo "Redis is not accessible!"
    exit 1
fi

echo "All services are healthy."
