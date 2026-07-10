<!-- yss_orbit\docs\runbooks\database-migration.md -->
# Database Migration Runbook

## Zero-Downtime Process (B24 Para 5.2)
1. PREPARE - Add columns alongside old ones, dual-write enabled
2. BACKFILL - Async idempotent backfill job
3. VERIFY - 100 percent row coverage, ARB sign-off
4. SWITCH - Code reads new columns only
5. CLEANUP - Drop old columns (optional maintenance window)

## Commands
  python manage.py migrate
  python manage.py backfill_tenant_data --migration-name=NAME
