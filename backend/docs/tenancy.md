<!-- yss_orbit\backend\docs\tenancy.md -->
# Tenancy

Orbit operates as a multi-tenant platform.
Every model and query MUST be isolated to the current `X-Business-Unit-Id`.
Tenant contexts are stored in standard Python ContextVars (see `core.tenancy`).
