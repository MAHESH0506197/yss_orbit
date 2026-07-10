<!-- yss_orbit\backend\docs\cqrs_selectors.md -->
# CQRS & Selectors

Orbit separates Commands (writes) from Queries (reads).
Queries are placed in `selectors/` utilizing optimized Django ORM and Materialized Views.
Commands are placed in `services/` or `tasks/`.
