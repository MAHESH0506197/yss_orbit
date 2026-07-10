<!-- yss_orbit\docs\runbooks\tenant-offboarding.md -->
# Tenant Offboarding Runbook (B24 Para 6)

## Phases
1. GRACE PERIOD 30 days - Data accessible, export available
2. SUSPENDED Day 30 - API returns 402, data retained
3. ARCHIVED Day 60 - GDPR deletion or retention applied
4. PURGED - Per C03 statutory retention (7 years financial)

## Commands
  POST /api/v1/platform/tenants/BU_ID/offboard/
  GET /api/v1/platform/tenants/BU_ID/data-export/
