<!-- yss_orbit\docs\adr\ADR-010-white-label-branding-tiers.md -->
# ADR-010: White-Label Branding Tiers

Status: Accepted

## Decision
Three tiers: Platform Brand, Co-Brand, Full White-Label (B22)

## Rationale
- Configuration-driven, no code forks
- BrandConfiguration table per Organization
- Frontend brand tokens applied at runtime
- NEVER tenant-specific builds or DB schema forks
