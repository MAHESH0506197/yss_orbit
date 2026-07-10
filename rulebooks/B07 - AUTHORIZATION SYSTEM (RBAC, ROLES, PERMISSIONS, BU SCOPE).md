<!-- yss_orbit\rulebooks\B07 - AUTHORIZATION SYSTEM (RBAC, ROLES, PERMISSIONS, BU SCOPE).md -->
# B07 - AUTHORIZATION SYSTEM (RBAC, ROLES, PERMISSIONS, BU SCOPE)

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01 (System Foundation), B02 (Multi-Tenant), B06 (Authentication System)
**Governance Role:** RBAC Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Role-based access control, permission definition and enforcement, data_scope governance, per-user permission overrides, permission cache invalidation, menu item permission requirements, deny-by-default policy, privilege escalation prevention, permission taxonomy enforcement, permission lifecycle governance |
| REFERENCES | B01 (security_context, canonical terms), B02 (tenant scope enforcement), B06 (authentication - must complete before RBAC), B15 (authorization audit logging) |
| MUST NOT DUPLICATE | security_context construction (B01), tenant isolation mechanics (B02), auth token mechanics (B06) |

---

## 1. PURPOSE

This rulebook defines the **complete authorization system (RBAC)** for YSS Orbit.

It establishes:
- Role-based access control
- Permission assignment and resolution
- BusinessUnit (tenant) scope enforcement
- Per-user permission overrides
- Menu item permission requirements

All actions in the system MUST be authorized using these rules.

---

## 2. SCOPE

Applies to: all API endpoints, all service layer operations, all background jobs and async tasks, all data access operations, all navigation menu items. No operation is exempt.

---

## 3. DEFINITIONS

All canonical terms from B01 §3 apply. Additional RBAC terms:

| Term | Definition |
|------|-----------|
| Role | Group of permissions assigned to users within a BusinessUnit |
| Permission | Specific allowed action code (e.g., `hrms.employee.view`) |
| Permission Code | Stable dot-notation identifier: `{module}.{resource}.{action}` format (e.g., `inventory.stock.adjust`) |
| `data_scope` | `BUSINESS_UNIT` or `GLOBAL` - controls access breadth |
| User Override | Per-user permission grant or revocation beyond role defaults |
| Deny by Default | Access is DENIED unless a verified permission explicitly allows it |

---

## 4. RBAC MODEL

### Authorization Flow (MANDATORY ORDER)

```text
Authentication (B06)
    ↓
RBAC Permission Check
    ↓
Tenant Scope Check (B02)
    ↓
Execution
```

Reordering this sequence is PROHIBITED.

### RBAC Resolution

```text
User → Role(s) → Permission(s) → data_scope → Allowed Actions
```

- Users MUST be assigned roles via UserBusinessUnit membership
- Roles MUST define permissions
- Permissions MUST control actions
- Permissions MUST NOT be assigned directly to users except as overrides (§5.13)

---

## 5. CORE GOVERNANCE LAWS

### 5.1 Role Assignment (MANDATORY)

- Every user MUST have at least one role to access protected operations
- User-role assignments MUST be scoped to a specific `business_unit_id` (for BUSINESS_UNIT roles)
- A user MAY hold different roles in different BusinessUnits
- Role evaluation MUST always consider: `user_id` + `business_unit_id`

| Role Data Scope | `UserRole.business_unit` |
|----------------|--------------------------|
| `BUSINESS_UNIT` | MUST be set |
| `GLOBAL` | MUST be NULL |

- Global role assignments (without BU scope) are ONLY allowed for roles with `data_scope = "GLOBAL"`
- Users without valid scoped roles MUST NOT access protected operations

### 5.2 Permission Definition (MANDATORY)

- Permissions MUST use format: `{module}.{resource}.{action}` dot-notation (e.g., `inventory.stock.view`, `billing.invoice.create`, `hrms.employee.delete`) — see §5.16 for full taxonomy
- Each permission MUST represent one atomic allowed action
- Permission codes MUST be lowercase dot-notation and immutable after production deployment
- Overloaded permissions (one code covering multiple unrelated actions) are PROHIBITED
- Duplicate permission codes are PROHIBITED

### 5.3 Permission Enforcement (MANDATORY)

- Every protected operation MUST check the required permission
- Missing permission checks are PROHIBITED
- Permission checking MUST use the centralized permission engine - inline manual checks are PROHIBITED

```python
# REQUIRED: Centralized decorator pattern
@login_required
@permission_required("inventory.stock.view")
def inventory_list(request): ...

# OR DRF-style
permission_classes = [HasPermission("inventory.stock.view")]
```

### 5.4 Tenant Scope Enforcement (MANDATORY)

- Permissions MUST be evaluated WITH tenant scope (B02)
- Access MUST be limited to `security_context["allowed_business_unit_ids"]`
- `data_scope = "GLOBAL"` bypasses tenant restriction ONLY after RBAC passes

### 5.5 GLOBAL vs Tenant Permissions (MANDATORY)

- `GLOBAL` permissions MUST be explicitly defined in role configuration
- `GLOBAL` access MUST NOT bypass RBAC
- GLOBAL scope expands tenant visibility ONLY - authentication and RBAC still apply
- One GLOBAL role MUST NOT accidentally elevate unrelated permissions

### 5.6 Service Layer RBAC Enforcement (MANDATORY)

- Authorization checks MUST occur at the Service Layer for complex authorization logic
- Views MUST NOT implement authorization logic beyond the permission decorator
- Repository Layer MUST NOT make authorization decisions

WHY THIS RULE EXISTS: Repository-level auth decisions are invisible to service orchestration, audit trails, and future changes. All auth logic must be in one authoritative layer.

### 5.7 Background Job Authorization (MANDATORY)

- Background jobs MUST validate permissions before executing protected operations
- Jobs MUST NOT bypass authorization
- Tenant context MUST be explicitly passed to jobs
- Jobs MUST reconstruct or receive an approved system `security_context`

### 5.8 Role Management (MANDATORY)

- Role creation MUST be controlled and audited
- Permission assignment to roles MUST be validated
- Deactivating a role immediately removes all permissions for users assigned to that role

```python
def assign_role_to_user(user_id, role_id, business_unit_id):
    role = Role.objects.get(pk=role_id)
    if not role.is_active or role.is_deleted:
        raise ValidationError("Cannot assign inactive or deleted role")
    # Proceed with assignment
```

### 5.9 Permission Storage (MANDATORY)

- Permissions MUST be centrally defined in the database
- Hardcoded permission strings in business logic MUST use named constants
- Permissions MUST NOT be stored in sessions, cookies, or browser storage as an authorization source

### 5.10 Deny by Default (MANDATORY)

- Access MUST be DENIED unless explicitly allowed by a verified permission
- Default behavior without permission check = DENY
- Implicit access grants are PROHIBITED

### 5.11 Auditability (MANDATORY)

- All authorization decisions (allowed AND denied) MUST be traceable via logs
- Authorization failures MUST be logged as security events
- Audit log format governed by B15

### 5.12 Least Privilege (MANDATORY)

- Users MUST have ONLY the permissions required for their role
- Excess permissions are PROHIBITED
- Permission reviews MUST be conducted when roles change
- Privilege escalation is PROHIBITED

### 5.13 Per-User Permission Overrides (MANDATORY)

The system MUST support per-user permission grants and revocations that override role-based permissions.

**Resolution Order (MANDATORY):**

```text
1. Load all role-based permissions (from all assigned roles)
2. Apply user-level grants (add specific permissions)
3. Apply user-level revocations (remove specific permissions)
4. Final = (Role Permissions ∪ User Grants) − User Revocations
```

```python
def resolve_user_permissions(user_id: str) -> set:
    # Step 1: Role-based permissions
    role_perms = load_role_permissions(user_id)

    # Step 2: User overrides
    overrides = UserPermissionOverride.objects.filter(user_id=user_id)
    granted = {o.permission_code for o in overrides if o.is_grant}
    revoked = {o.permission_code for o in overrides if not o.is_grant}

    # Step 3: Combine
    return (role_perms | granted) - revoked
```

Rules:
- Permission changes MUST invalidate permission cache immediately
- All permission changes MUST be audit logged
- Permission cache MUST be invalidated when: role changes, permission assignment changes, user-BU membership changes

### 5.14 Menu Items Must Have Permissions (MANDATORY)

Every navigation menu item MUST reference a `permission_code`.

Rules:
- A menu item WITHOUT a `permission_code` MUST NOT be created
- Menu item visibility = user has the referenced `permission_code`
- Menu visibility is UX ONLY - it is NEVER an authorization mechanism
- Backend MUST still enforce permissions regardless of menu visibility

Pre-deployment SQL validation:

```sql
SELECT item_name FROM navigation_menu_items
WHERE permission_code IS NULL OR permission_code = '';
-- Expected: 0 rows - any result = DEPLOYMENT BLOCKED
```

**Violation:** Menu item without `permission_code` = deployment blocker.

### 5.15 Permission Cache Safety (MANDATORY)

- Permission cache MUST include `user_id` in the cache key
- Cross-user permission cache sharing is PROHIBITED
- Cache MUST be invalidated on any role or permission change
- Stale permission cache = privilege escalation risk (HIGH violation)

Cache key format for permissions:
```text
permissions:{user_id}:{business_unit_id}
```

---

### 5.16 Permission Taxonomy (MANDATORY)

All permission codes MUST follow the taxonomy:

```
{module_code}.{resource}.{action}

Examples:
  hrms.employee.view
  hrms.employee.create
  payroll.run.approve
  inventory.stock.adjust
  branding.config.update
  platform.module.activate
  platform.impersonation.start
  reports.export.schedule
```

### 5.17 Permission Lifecycle Rules (MANDATORY)

| Stage | Rule |
|-------|------|
| Creation | Reviewed by ARB before seeding |
| Active | Code never changes after creation |
| Module deprecated | `is_active = FALSE` - never deleted |
| Module retired | Permission record retained for audit trail |

**MOST IMPORTANT:** Permission codes MUST NEVER be renamed after creation. Roles reference permission codes - renaming silently breaks all role assignments that use the old code.

### 5.18 Permission Groups for Platform Modules (MANDATORY)

```python
# B22 Branding permissions:
('branding.config.view',   'BRANDING'),
('branding.config.update', 'BRANDING'),
('branding.domain.manage', 'BRANDING'),

# B24 Support operations permissions:
('platform.impersonation.start',    'PLATFORM_ADMIN'),
('platform.impersonation.approve',  'PLATFORM_ADMIN'),
('platform.diagnostics.view',       'PLATFORM_ADMIN'),
('platform.onboarding.manage',      'PLATFORM_ADMIN'),
('platform.offboarding.manage',     'PLATFORM_ADMIN'),

# B25 Reporting permissions:
('reports.export.view',             'REPORTS'),
('reports.export.schedule',         'REPORTS'),
('reports.export.admin',            'REPORTS'),
('reports.search.global',           'REPORTS'),

# B23 Module lifecycle permissions:
('platform.module.lifecycle.manage', 'PLATFORM_ADMIN'),
```

### 5.19 Permission Explosion Prevention (MANDATORY)

Before adding any new permission, the engineer MUST:

1. Check if an existing permission already covers the use case (e.g., don't add 'hrms.employee.read' if 'hrms.employee.view' exists)
2. Follow the taxonomy exactly (e.g., DON'T add 'see_employees' - MUST be 'hrms.employee.view')
3. Get ARB approval before seeding (one-way door: permissions cannot be renamed after creation)
4. Add to the permission group in B07 §5.18 permission catalogue

ANTI-PATTERN - Creating permissions with vague names:
- 'admin_access'  ← PROHIBITED - what does this mean?
- 'can_view'      ← PROHIBITED - view what? in which module?
- 'super_user'    ← PROHIBITED - use SUPER_ADMIN role instead


## 6. SECURITY & COMPLIANCE

### Authorization Security
- All operations MUST be authorized before execution
- Unauthorized access MUST be rejected with 403
- Permission escalation is PROHIBITED
- Role-name-based bypasses (e.g., `if role_name == "ADMIN"`) are PROHIBITED - use permission codes

### Audit Logging

All authorization decisions MUST be logged:

```json
{
  "user_id": "uuid",
  "permission_code": "inventory.stock.view",
  "result": "ALLOWED | DENIED",
  "business_unit_id": "uuid",
  "trace_id": "uuid",
  "correlation_id": "uuid",
  "timestamp": "utc_iso8601"
}
```

---

## 7. NON-NEGOTIABLE RULES

- Missing permission check = CRITICAL violation
- Role name bypass (`is_super_admin`, role name string checks) = PROHIBITED
- Unauthorized access = CRITICAL violation
- Hardcoded role name checks instead of permission codes = PROHIBITED
- Permission cache not invalidated on role change = HIGH violation
- Menu item without permission_code = deployment blocker
- Cross-user permission cache sharing = CRITICAL violation
- Privilege escalation = PROHIBITED
- Permission code renamed after creation = PROHIBITED (HIGH)
- Permission added without ARB approval = PROHIBITED
- Vague permission names (admin_access, can_view) = PROHIBITED

---

## 8. VIOLATIONS & ENFORCEMENT

Non-compliant code MUST NOT be merged or deployed.

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 9. TESTING REQUIREMENTS

- Permission checks MUST be tested for all endpoints
- Role-based access MUST be tested (positive and negative)
- Tenant scope enforcement MUST be tested
- Negative tests (unauthorized access attempts) are REQUIRED
- User override (grant and revoke) MUST be tested
- Permission cache invalidation MUST be tested
- Menu item without permission MUST be detected in deployment checks
- Any failing test MUST block deployment

---

## 10. QUICK SUMMARY

- Every action MUST require a permission check
- Access is DENIED by default
- Tenant scope MUST always be enforced
- Use permission codes - never role names - for authorization logic
- User overrides can grant or revoke permissions beyond role defaults
- Menu items MUST have permission codes - they are UX only, not security

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.
