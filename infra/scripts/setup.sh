#!/usr/bin/env bash
# yss_orbit\infra\scripts\setup.sh
set -e

echo "Setting up development environment..."

# Wait for databases
echo "Waiting for PostgreSQL..."
while ! pg_isready -h localhost -p 5432 -U "${POSTGRES_USER:-postgres}"; do
  sleep 1
done

echo "Running migrations..."
./infra/scripts/migrate.sh

echo "Environment setup complete!"
