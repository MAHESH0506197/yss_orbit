# `hrms_core` Deprecation Record

**Status**: Deprecated
**Replacement**: `apps.hrms`
**Removal Target**: Next cleanup release

## Background
The `hrms_core` application was an early scaffolding iteration that was superseded by the fully event-driven, DDD-compliant `hrms` module. An audit confirmed that the database tables (`hrms_core_employee`, etc.) were never populated with production data (row count = 0), making migration trivial.

## Affected Models
- `Employee`
- `Department`
- `Designation`
- `EmployeeProfile`
- `EmployeeDocument`

## Migration Completed
The following cross-domain dependencies have been migrated to reference the `hrms.Employee` models via a Django migration:
- `Appraisal Goal` (`appraisal_goal` table)
- `Performance Review` (`appraisal_performance_review` table)

## Remaining External References
- **0**

## Action Items for Next Cleanup Release
1. Remove `apps.hrms_core` from `config/settings/base.py` `LOCAL_APPS`.
2. Delete the `apps/hrms_core` directory entirely.
3. Drop the `hrms_core_*` tables from the PostgreSQL database using a manual migration or SQL drop script.
4. Remove this deprecation record.
