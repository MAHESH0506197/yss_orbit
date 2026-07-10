<!-- yss_orbit\backend\docs\rbac.md -->
# Role Based Access Control (RBAC)

RBAC consists of:
- Modules (e.g. `billing`)
- Scopes (e.g. `read:invoice`, `write:invoice`)
- Roles (e.g. `Admin`, `User`)
Permissions are cached per tenant user to optimize performance.
