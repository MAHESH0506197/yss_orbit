<!-- yss_orbit\docs\adr\ADR-009-rbac-permission-model.md -->
# ADR-009: RBAC Dot-Notation Permissions

Status: Accepted

## Decision
Permission codes use dot-notation: MODULE.RESOURCE.ACTION

## Rationale
- Clear module ownership in the code
- Granular action control
- Aligned with module subscription model (E04)
- Immutable after production seeding
