#!/usr/bin/env bash
# yss_orbit\infra\scripts\seed.sh
set -e

echo "Seeding the database..."
cd /app
python -m scripts.seed_db
echo "Database seeded successfully."
