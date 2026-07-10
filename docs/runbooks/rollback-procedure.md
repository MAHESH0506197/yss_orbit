<!-- yss_orbit\docs\runbooks\rollback-procedure.md -->
# Rollback Procedure Runbook

## Application Rollback
  kubectl rollout undo deployment/yss-orbit-api
  kubectl rollout status deployment/yss-orbit-api
  GET /api/v1/health/ (verify)

## Database Rollback (reversible migrations only)
  python manage.py migrate app_name previous_migration

NOTE: Zero-downtime migrations (B24 Para 5.2) are non-destructive by design.
