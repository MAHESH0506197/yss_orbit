# B28 - MODULE & FEATURE REGISTRY ARCHITECTURE

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01, B02 (Multi-Tenant), B07 (RBAC)
**Governance Role:** Platform SaaS Governance Authority

---

## 1. PURPOSE

This rulebook defines the **3-Layer Access Control and Licensing Architecture** for YSS Orbit. It outlines platform governance standards for the Module Registry, Subscription Plans, and Feature Flag systems.

Without this rulebook, modules are accessible to all tenants regardless of their subscription. This rulebook ensures that:
- Only subscribed modules and features are accessible per tenant.
- Plan limits are enforced at every relevant operation.
- Feature flags enable per-tenant capability control without code deployments.
- Module and feature dependencies are validated before activation.

---

## 2. ARCHITECTURAL HIERARCHY

The platform is strictly organized into four tiers from broad functionality down to granular API execution:

1. **Category** (`ModuleCategory`): High-level grouping of modules (e.g., HR, Finance, Platform).
2. **Module** (`PlatformModule`): A distinct, licensable business application (e.g., Core HRMS, Payroll).
3. **Feature** (`PlatformFeature`): A granular functional capability within a module (e.g., Payslips, Salary Structures).
4. **Permission** (`Permission`): Granular RBAC actions (`module.resource.action`), strictly bound to a Feature.

### Dependency Rules & Relationships
- A `PlatformModule` cannot exist without a `ModuleCategory`.
- A `PlatformFeature` cannot exist without a `PlatformModule`.
- A `Permission` must map to a `PlatformFeature`.
- **Module Dependencies (`ModuleDependency`)**: A module may require another module to function (e.g., Payroll requires HRMS).
- **Feature Dependencies (`FeatureDependency`)**: A feature may require another feature to function (e.g., Payslips require Employees).
- **Versioning (`CatalogVersion`)**: All modules are scoped to a distinct CatalogVersion to allow for safe migrations and future-proofing (e.g., v1.0, v2.0).

---

## 3. PLATFORM FEATURE METADATA

Every `PlatformFeature` maintains essential metadata to drive frontend rendering and billing capabilities:
- **`status`**: The lifecycle stage of the feature (DRAFT, ACTIVE, DEPRECATED, ARCHIVED, LEGACY).
- **`is_licensable`**: Determines if a `BusinessUnit` must explicitly subscribe to this feature to use it.
- **`is_premium`**: Used for billing tiers, indicates if the feature requires a premium plan.
- **`is_visible_in_sidebar`**: Whether the feature should render as a navigation item.
- **`navigation_url`**: The relative path for routing (e.g., `/platform/payroll/payslips`).
- **`icon`**: Lucide icon name.

---

## 4. THE RUNTIME FLOW (ENTERPRISE API GATING)

Execution of any restricted API endpoint is governed by `apps.rbac.permissions.platform_access.RequiresCapability`.

**WHAT:** Module and Feature subscription checks MUST occur AFTER authentication and BEFORE RBAC.
**WHY:** Checking module access before RBAC would allow an unauthenticated attacker to probe which modules a tenant has subscribed to. RBAC validates identity and permissions first.

**The flow executes sequentially on every request:**
1. **Module License Check**: Is the Business Unit actively subscribed to the required `PlatformModule` via `BusinessUnitModule`?
2. **Feature License Check**: Is the Business Unit actively subscribed to the required `PlatformFeature` via `BusinessUnitFeature`?
3. **RBAC Verification**: Does the User hold the specific `Permission` code through their assigned `Role`?

If any of these 3 checks fail, the request is immediately rejected with `403 Forbidden`.

---

## 5. API ENDPOINTS MAPPING

To ensure no orphaned permissions exist and to assist in system validation, every `Permission` must declare its mapped `api_resource` and `http_methods`.

Example:
```json
{
  "code": "organization.organization.create",
  "api_resource": "organization",
  "http_methods": ["POST"]
}
```
Validation via `manage.py validate_module_registry` enforces that all active permissions have valid API Resource mappings. If they are missing, the CI pipeline will explicitly fail with exit code `1`.

---

## 6. SUBSCRIPTION PLANS (MANDATORY)

Subscriptions strictly operate at the Module and Feature level (`BusinessUnitModule` / `BusinessUnitFeature`). Permissions are **never** part of subscriptions. RBAC remains independent and focuses solely on user authorization within the bounds of what the Business Unit has licensed.

**Plan Limits - Standard Definition:**

| Plan | Max Users | Max Branches | Max Modules | Key Features |
|------|-----------|-------------|-------------|-------------|
| FREE | 5 | 1 | 1 | Basic reports, email support |
| BASIC | 25 | 3 | 3 | Standard reports, biometric attendance |
| PRO | 100 | 10 | All | Advanced reports, API access, priority support |
| ENTERPRISE | Unlimited | Unlimited | All + custom | White-label, dedicated SLA, custom integrations |

### Plan Limit Enforcement
**WHAT:** Plan limits MUST be enforced at the Service Layer via a dedicated `PlanLimitService`. Limits MUST NOT be checked only at the UI layer.

```python
class PlanLimitService:
    def check_user_limit(self, business_unit_id: UUID) -> None:
        plan = self._get_active_plan(business_unit_id)
        if plan.max_users is None:
            return  # Unlimited
        current = UserBusinessUnit.objects.filter(
            business_unit_id=business_unit_id,
            is_active=True,
        ).count()
        if current >= plan.max_users:
            raise PlanLimitExceeded(
                f"Your plan allows a maximum of {plan.max_users} users."
            )
```
**Error code for plan limit:** `PLAN_LIMIT_EXCEEDED` (HTTP 402) - add to X02 error catalogue.

---

## 7. FEATURE FLAG SYSTEM (MANDATORY)

> [!CAUTION]
> Do NOT confuse the Feature Registry with Feature Flags!
> - **Feature Registry (`PlatformFeature`)**: Represents permanent, licensable business capabilities.
> - **Feature Flags**: Represents temporary, developmental switches (e.g., beta testing, experimental phases).

**WHAT:** Feature flags enable per-tenant capability control without code deployments. Large enterprise clients get `advanced_payroll`; small clients get `basic_payroll`. Beta features can be tested on 2 pilot tenants before platform-wide release.

**Feature Flag Resolution Logic (MANDATORY):**
```text
Resolution order:
1. Check tenant-specific override in database.
2. Check feature flag's plan minimum vs tenant's active plan.
3. Fall back to feature flag's default_enabled status.
```

---

## 8. MODULE ACTIVATION & DEPENDENCIES

All module subscription changes MUST be audit-logged and validated against `ModuleDependency` rules.

**WHAT:** When a tenant tries to activate a module, the system MUST verify all dependencies are already active.
**WHY:** Activating Payroll without HRMS Core is meaningless. Activating modules without their dependencies results in broken functionality.

---

*THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARB APPROVAL.*
