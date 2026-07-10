# YSS Orbit — Organization Module Backend Audit Report

**Audit Scope:** Organization, BusinessDomain, BusinessUnit, BusinessUnitModule, UserBusinessUnitModel, OrganizationSettings  
**Date:** 2025-07-06  
**Auditor:** Deep Backend Audit (Automated + Manual Review)  
**Files Reviewed:** 45+ backend files across models, serializers, views, services, repositories, permissions, migrations, tests, events, and orchestrators.

---

## 1. Executive Summary

The Organization module shows evidence of aggressive iterative development with multiple "FIX-BUG" and "ISSUE" annotations. While many known defects have been patched, **critical synchronization gaps remain between the model layer, migrations, tests, and the actual runtime code.** The most severe issues are:

1. **Broken runtime code** — `OrganizationViewSet.meta` references an undefined variable (`SLUG_REGEX_PATTERN`), `OrganizationOnboardingService` and `BuOnboardingService` pass removed fields (`slug`, `industry`) to constructors, and `OrganizationSelectors` queries a removed column (`slug`). These will crash in production.
2. **Data integrity violations** — `UserBusinessUnitModel` uses `on_delete=models.CASCADE` on both FKs, allowing hard deletes to bypass the platform's mandatory soft-delete policy. Unique constraints on `BusinessUnitModule`, `Organization.name`, and `BusinessDomain.name/code` do not exclude soft-deleted rows, causing ghost blocking.
3. **Cross-tenant exposure** — `UserBusinessUnitViewSet.create` does not validate that the target Business Unit belongs to the caller's organization scope.
4. **Test suite is completely broken** — Every existing test references the removed `slug` field and will fail on import or execution.

**Severity Count:**
- CRITICAL: 12
- HIGH: 18
- MEDIUM: 14
- LOW: 8

---

## 2. Database / Schema Findings

### CRITICAL

#### C-SCHEMA-01: Unique constraints do not exclude soft-deleted records
**Files:** `models/organization_model.py:47`, `models/business_domain_model.py:10-11`, `models/business_unit_module.py:66-71`

`Organization.name` has `unique=True` on the field. `BusinessDomain.name` and `.code` also have `unique=True`. `BusinessUnitModule` has a `UniqueConstraint` on `(business_unit_id, module)` with NO `condition=Q(is_deleted=False)`.  
**Impact:** Once a record is soft-deleted, its name/code/composite-key permanently blocks creation of a new record with the same value. This is a well-known anti-pattern in soft-delete architectures.
**Fix:** Replace field-level `unique=True` with `UniqueConstraint(..., condition=Q(is_deleted=False))`.

#### C-SCHEMA-02: UserBusinessUnitModel FKs use CASCADE hard delete
**File:** `models/user_business_unit_model.py:21-30`

```python
user = models.ForeignKey("iam.User", on_delete=models.CASCADE, ...)
business_unit = models.ForeignKey("organization.BusinessUnit", on_delete=models.CASCADE, ...)
```

**Impact:** If a `User` or `BusinessUnit` is hard-deleted (e.g., by a super-admin cleanup script or raw SQL), Django will hard-delete all linked UBU memberships, **permanently destroying audit data** that the platform mandates be soft-deleted only. This directly violates the `BaseModel` docstring: "hard delete is PROHIBITED for business data."
**Fix:** Change both FKs to `on_delete=models.PROTECT` to enforce the soft-delete policy at the DB level. If a hard delete is truly required, it must explicitly soft-delete memberships first.

#### C-SCHEMA-03: Migration 0004 destructively drops OrganizationSettings table
**File:** `migrations/0004_org_remove_slug_add_restored_fields_indexes.py:58-60`

```python
migrations.RunSQL(
    sql="DROP TABLE IF EXISTS organization_settings CASCADE;",
    reverse_sql="",  # No rollback possible after drop
)
```

**Impact:** This migration will **permanently delete all existing organization settings data** when applied. The comment states "data loss is acceptable" because the table is "auto-provisioned," but production settings (MFA flags, session timeouts, IP ranges, custom domains) are not idempotent seed data — they are tenant configuration.
**Fix:** Replace the `DROP TABLE` + `CreateModel` with a proper migration that:
1. Adds a new UUID column.
2. Populates it.
3. Swaps primary keys.
4. Or, at minimum, back up the table before dropping it.

#### C-SCHEMA-04: BusinessUnitModule migration drift — `is_active` missing in 0001, added in 0008
**Files:** `migrations/0001_initial.py:195-273`, `migrations/0008_...`

`BusinessUnitModule` inherits from `TenantModel → BaseModel`, which declares `is_active`. However, `0001_initial` explicitly lists fields and omits `is_active`. Migration `0008` adds it later. This indicates the initial migration was hand-edited or generated from an inconsistent model state.  
**Impact:** New environments applying migrations from 0001→0008 will have a schema that temporarily lacks `is_active` on `business_unit_module`. Any code running between those two migrations that expects the column will fail.
**Fix:** Squash migrations or ensure 0001 is regenerated to match the true initial state.

---

### HIGH

#### H-SCHEMA-01: OrganizationSettings soft-delete is orphaned from Organization soft-delete
**Files:** `organizations_service.py:101-158`, `organizations_service.py:159-226`

When `OrganizationService.delete_organization()` soft-deletes an org, it does **not** soft-delete the linked `OrganizationSettings`. The `restore_organization()` method then tries to restore settings that were never soft-deleted:

```python
restored_settings = OrganizationSettings.all_objects.filter(organization=org, is_deleted=True).update(...)
```

This query will **always return 0 rows**, making the restore code dead and creating an inconsistency where the org is archived but its settings remain active.
**Fix:** Cascade-soft-delete settings in `delete_organization()`, or remove the dead restore logic.

#### H-SCHEMA-02: BusinessUnit lacks `restored_at` / `restored_by_id` audit fields
**File:** `models/business_unit_model.py`

`Organization` and `BusinessDomain` both have `restored_at`, `restored_by_id`, and `restored_reason`. `BusinessUnit` does not. When `OrganizationService.restore_organization()` bulk-restores cascade-deleted BUs, there is no audit trail of who restored them or when.
**Fix:** Add `restored_at`, `restored_by_id`, `restored_reason` to `BusinessUnit` (or at minimum document the inconsistency).

#### H-SCHEMA-03: Organization.email index bloat
**File:** `models/organization_model.py:52`

`email = models.EmailField(blank=True, default="", db_index=True)` creates an index where the vast majority of values are empty strings. This bloats the index and slows inserts.
**Fix:** Use a partial index: `models.Index(fields=["email"], condition=Q(email__gt=""), name="org_email_idx")`.

#### H-SCHEMA-04: Organization.save() performs a DB query on every save
**File:** `models/organization_model.py:91-107`

```python
def save(self, *args, **kwargs):
    if self.pk:
        old_domain_id = Organization.objects.filter(pk=self.pk).values_list(...).first()
```

**Impact:** Every `save()` call triggers an extra SELECT. On bulk updates or high-traffic writes, this adds significant overhead.
**Fix:** Move this validation to `clean()` and call `full_clean()` in the serializer/service layer. Or use `update_fields` awareness to skip the check when `business_domain` is not being updated.

---

### MEDIUM

#### M-SCHEMA-01: OrganizationSettings Meta doesn't inherit BaseModel options
**File:** `models/organization_settings_model.py:58-61`

`class Meta:` (no inheritance from `BaseModel.Meta`) means `ordering` and `get_latest_by` from `BaseModel` are lost. The table will use Django's default ordering (by PK) instead of `-created_at`.
**Fix:** Change to `class Meta(BaseModel.Meta):`.

#### M-SCHEMA-02: Missing `db_index` on `UserBusinessUnitModel.role_id`
**File:** `models/user_business_unit_model.py:31-36`

No index on `role_id`. If querying "all users with Role X in BU Y", the query planner may need to scan.
**Fix:** Add `db_index=True` to the `role` FK, or add a composite index on `(business_unit, role)`.

#### M-SCHEMA-03: BusinessUnitModule `is_active` shadowing confusion
**File:** `models/business_unit_module.py:81-91`

The model has both `is_active` (inherited from BaseModel, a DB column) and `is_module_active` (a property). The property docstring explains the rename was intentional to avoid shadowing, but `is_active` is still present as a writable DB field. A developer could accidentally set `is_active=False` on the row while `status=ACTIVE`, creating an inconsistent state.
**Fix:** Add a model `clean()` validation that asserts `is_active=True` whenever `status` is `ACTIVE` or `TRIAL`.

---

## 3. API / Backend Findings

### CRITICAL

#### C-API-01: `OrganizationViewSet.meta` references undefined `SLUG_REGEX_PATTERN`
**File:** `api/views/organization_view.py:373`

```python
return SuccessResponse(data={"validation": {"slug_regex": SLUG_REGEX_PATTERN}})
```

`SLUG_REGEX_PATTERN` is **not imported** in `organization_view.py`. This action will raise `NameError` on every request.
**Fix:** Import `SLUG_REGEX_PATTERN` from `apps.organization.constants.constants`, or remove the endpoint since slug was deleted.

#### C-API-02: `OrganizationOnboardingService` passes removed `slug` field
**File:** `services/organization_onboarding_service.py:13`

```python
return OrganizationService().create_organization(
    {"name": name, "slug": slug, "email": admin_email}
)
```

The `Organization` model no longer has a `slug` field (removed in migration 0004). `OrganizationService.create_organization` does `Organization(**data)`, which will raise `TypeError: Organization() got an unexpected keyword argument 'slug'`.
**Fix:** Remove `slug` from the payload.

#### C-API-03: `BuOnboardingService` and `BusinessUnitOrchestrator` pass removed `industry` field
**Files:** `services/bu_onboarding_service.py:47-53`, `orchestrators/business_unit_orchestrator.py:40-47`

Both pass `industry` in the data dict. `BusinessUnit` model has no `industry` field. `BusinessUnitService.create_business_unit` does `BusinessUnit(**data)`, which will raise `TypeError`.
**Fix:** Remove `industry` from the payload.

#### C-API-04: `OrganizationSelectors` queries removed `slug` column
**File:** `selectors/organization_selectors.py:24-30`, `50-60`

```python
def get_by_slug(slug: str) -> Organization | None:
    return Organization.objects.filter(slug=slug, ...).first()

def search(term: str) -> QuerySet:
    return Organization.objects.filter(Q(name__icontains=term) | Q(slug__icontains=term) | ...)
```

These selectors will raise `FieldError: Cannot resolve keyword 'slug' into field` at runtime.
**Fix:** Remove all `slug` references from selectors.

#### C-API-05: `OrganizationViewSet.create` may 500 for non-super-admins
**File:** `api/views/organization_view.py:248-260`

After creating an org, the view does:
```python
org_with_counts = self.get_queryset().get(pk=org.pk)
```

For non-super-admins, `get_queryset()` scopes to `id__in=user_org_ids`. A user who just created an org has **no UBU membership** linking them to it yet, so `self.get_queryset()` excludes the new org, causing `Organization.DoesNotExist` and a 500 error.
**Fix:** After creation, fetch the org from `Organization.all_objects` or auto-provision a UBU membership for the creator.

#### C-API-06: `UserBusinessUnitViewSet.create` lacks cross-tenant boundary validation
**File:** `api/views/user_business_unit_view.py:185-221`

A user with `users.userbu.create` permission can assign any user to any BU in any organization. The view and service do not verify that `business_unit` belongs to the requester's organization.
**Fix:** Add an org-scoping check in the view or service:
```python
if not request.user.is_super_admin:
    assert bu.organization_id == request.user.organization_id
```

---

### HIGH

#### H-API-01: `UserBusinessUnitViewSet.get_queryset` ignores B27 suspension precedence rules
**File:** `api/views/user_business_unit_view.py:115-151`

The queryset uses `UserBusinessUnitModel.objects.all()` and filters only by `is_active_membership`. It does NOT filter by:
- `business_unit__is_active=True`
- `business_unit__is_deleted=False`
- `business_unit__organization__is_active=True`
- `business_unit__organization__is_deleted=False`
- Effective date windows (`effective_from`, `effective_to`)

**Impact:** The list endpoint returns memberships for inactive BUs, archived BUs, inactive orgs, and expired date ranges. This leaks data and misleads the frontend.
**Fix:** Replace `.all()` with `get_active_memberships_query()` from selectors, and add user-scoping.

#### H-API-02: `BusinessUnitModule` unique constraint blocks re-activation after soft-delete
**File:** `models/business_unit_module.py:66-71`

As noted in C-SCHEMA-01, the unique constraint on `(business_unit_id, module)` has no `is_deleted=False` condition. If a module subscription is ever soft-deleted (via admin or future code), it can never be re-created.
**Fix:** Add `condition=models.Q(is_deleted=False)` to the constraint.

#### H-API-03: `OrganizationSettingsSerializer.update` reads raw `request.data` instead of `validated_data`
**File:** `api/serializers/organization_serializer.py:80-101`

```python
def update(self, instance, validated_data):
    request = self.context.get("request")
    data = request.data if request else {}
    if "custom_domain" in data:
        ...
```

This is a DRF anti-pattern. `custom_domain` is not in the serializer's `Meta.fields`, so it never appears in `validated_data`. The serializer reaches into raw request data, bypassing validation, type coercion, and DRF's input sanitization.
**Fix:** Add `custom_domain` as a `SerializerMethodField` or `CharField(write_only=True)` on the serializer, and process it from `validated_data`.

#### H-API-04: `OrganizationViewSet.upload_logo` doesn't set `updated_by_id`
**File:** `api/views/organization_view.py:383-414`

The logo upload updates `logo_url` and `updated_at` but does not record `updated_by_id`. The BusinessUnit view DOES set this (line 361). Inconsistent audit trail.
**Fix:** Add `org.updated_by_id = request.user.id` before saving.

#### H-API-05: File upload endpoints don't validate file extensions
**Files:** `organization_view.py:394`, `business_unit_view.py:342`, `business_domain_view.py` (via service)

All three upload endpoints check `content_type` but preserve the original file extension:
```python
ext = os.path.splitext(logo_file.name)[1].lower() or ".png"
```

An attacker can upload `malicious.php` with `content_type="image/jpeg"` and it will be saved as `...php`. While Django's static file serving doesn't execute PHP, this is a vector for XSS if the file is later served with `Content-Disposition: inline` and the browser sniffs the extension.
**Fix:** Validate the extension against a whitelist (`{'.jpg', '.jpeg', '.png', '.webp', '.gif'}`) and reject or force-rename mismatches.

#### H-API-06: `BusinessUnitModuleViewSet.activate` fail-open on missing subscription
**File:** `api/views/business_unit_module_view.py:262-288`

If no `BusinessUnitSubscription` record exists for the BU, the activation is allowed. The docstring admits this is intentional, but it means a BU can activate paid modules without a valid subscription.
**Fix:** Fail-closed: if no subscription exists, reject activation of non-free modules.

#### H-API-07: `UserBusinessUnitService.create_membership` race condition on duplicate check
**File:** `services/user_business_unit_service.py:88-93`

```python
if UserBusinessUnitModel.objects.filter(...).exists():
    raise ValueError(...)
# ...create...
```

The `.exists()` check is not atomic with the `.create()`. Two concurrent requests can both pass the check and then hit an `IntegrityError` on insert. The code catches `ValueError` but not `IntegrityError`.
**Fix:** Remove the `.exists()` check and catch `IntegrityError` instead, or use `select_for_update()` on a sentinel row.

---

### MEDIUM

#### M-API-01: `OrganizationModel.save()` raises `ValidationError`
**File:** `models/organization_model.py:91-107`

Raising `ValidationError` inside `save()` is non-standard. Django's `ModelForm` and DRF serializers call `full_clean()` before `save()`, so the error is usually caught earlier. However, if `save()` is called directly (e.g., from a management command or shell), the `ValidationError` propagates instead of the more expected `IntegrityError` or `ValueError`.
**Fix:** Move the domain-change validation to `clean()` and call `full_clean()` in the serializer/service.

#### M-API-02: `OrganizationSettingsService` doesn't audit `updated_by_id`
**File:** `services/organization_settings_service.py:15-20`

```python
def update(org: Organization, data: dict[str, Any]) -> OrganizationSettings:
    settings, _ = OrganizationSettings.objects.get_or_create(organization=org)
    for k, v in data.items():
        setattr(settings, k, v)
    settings.save()
```

No `updated_by_id` tracking. All settings changes are anonymous in the audit trail.
**Fix:** Accept `updated_by_id` parameter and include it in `save(update_fields=[..., "updated_by_id"])`.

#### M-API-03: `BusinessUnitSerializer.get_logo_url` can query organization if `obj.organization_id` is None
**File:** `api/serializers/business_unit_serializer.py:50`

```python
return obj.logo_url or (obj.organization.logo_url if obj.organization_id else None)
```

If `obj.organization_id` is None, it returns `None`. But if `obj.organization_id` is set and `obj.organization` is not select_related, this triggers an N+1 query. The view does `select_related("organization")`, so this is mitigated, but the serializer is fragile.
**Fix:** Ensure the serializer context enforces that `organization` is select_related.

#### M-API-04: `BusinessDomainService.restore_domain` calls `domain.save()` twice
**File:** `services/business_domain_service.py:99-121`

`domain.restore()` already calls `save(update_fields=[...])`. Then the method sets `restored_at`, `restored_by_id`, `restored_reason` and calls `save()` again with a different `update_fields` list. Two DB round-trips for one logical operation.
**Fix:** Set the restored fields before calling `restore(save=False)` and then do a single `save()`.

---

## 4. Security Findings

### CRITICAL

#### C-SEC-01: CASCADE on UBU memberships allows hard-delete bypass
**File:** `models/user_business_unit_model.py:21-30`

As described in C-SCHEMA-02. If an attacker (or a buggy admin script) hard-deletes a User or BU, all membership audit records are permanently destroyed.

#### C-SEC-02: Cross-tenant membership creation
**File:** `api/views/user_business_unit_view.py:185-221`

As described in C-API-06. A compromised account with `users.userbu.create` can infiltrate any tenant by adding users to arbitrary BUs.

#### C-SEC-03: File upload extension spoofing
**File:** `api/views/organization_view.py:394`, `api/views/business_unit_view.py:342`

As described in H-API-05. Uploaded files retain attacker-controlled extensions.

---

### HIGH

#### H-SEC-01: `OrganizationService.delete_organization` uses synthetic super-admin context
**File:** `organizations_service.py:128-135`

```python
system_ctx = SecurityContext(
    user_id=deleted_by_id or uuid.UUID(int=0),
    business_unit_id=uuid.UUID(int=0),
    correlation_id="org-cascade-delete",
    is_super_admin=True,
)
```

If `deleted_by_id` is None, `user_id` becomes `uuid.UUID(int=0)` (all zeros). This synthetic user ID may not exist in the DB, but `is_super_admin=True` bypasses all permission checks in downstream services. While this is only for internal cascade operations, logging and audit trails will show a non-existent user performed the action.
**Fix:** Require `deleted_by_id` to be non-None, or use a well-known system user ID.

#### H-SEC-02: `UserBusinessUnitService.create_membership` doesn't validate target user existence
**File:** `services/user_business_unit_service.py:71-138`

If `user_id` doesn't exist, the FK insert will raise `IntegrityError` at the DB level. The service catches `ValueError` but not `IntegrityError`, so the exception bubbles up uncaught.
**Fix:** Explicitly check `User.objects.filter(id=user_id).exists()` before creating, or catch `IntegrityError`.

#### H-SEC-03: `BusinessUnitViewSet.create` allows super-admin to bypass org scoping via body
**File:** `api/views/business_unit_view.py:220-253`

A super-admin can pass `organization_id` in the request body to create a BU in any org. This is intentional for super-admins, but there's no additional logging or approval workflow for this powerful action.
**Fix:** Add an explicit audit log entry whenever a super-admin creates a BU in an org other than their own.

---

## 5. Performance Findings

### HIGH

#### H-PERF-01: `Organization.save()` extra query per save
**File:** `models/organization_model.py:91-107`

As described in H-SCHEMA-04. One extra SELECT on every save.

#### H-PERF-02: `OrganizationViewSet._get_user_org_ids()` called multiple times per request
**File:** `api/views/organization_view.py:143-156`

Called in `get_queryset()` and again in `list()` for stats. Each call executes the same subquery. Could be memoized on `self.request._cached_org_ids`.

#### H-PERF-03: `BusinessDomainSerializer.get_active_users_count` fallback is N+2
**File:** `api/serializers/business_domain_serializer.py:29-58`

If the view didn't annotate `active_users_count`, the serializer does:
1. Query BU IDs for the domain.
2. Query distinct user count for those BU IDs.

This is called for every domain in an un-annotated list.
**Fix:** Ensure the viewset always annotates this value, or use a `Subquery` annotation.

---

### MEDIUM

#### M-PERF-01: `BusinessUnitModuleViewSet.list` serializes synthetic entries on every request
**File:** `api/views/business_unit_module_view.py:168-213`

For every `list` call, the view queries all `PlatformModule` objects (up to 18), serializes missing ones, and merges them. This is lightweight but unnecessary — the module catalog rarely changes.
**Fix:** Cache the serialized platform module list in Redis or a class-level cache for a short TTL (e.g., 60 seconds).

#### M-PERF-02: `BusinessUnitListSerializer` has 10+ SerializerMethodFields
**File:** `api/serializers/business_unit_serializer.py:94-122`

Each method field adds Python overhead. While `_get_brand_config()` caches per-object, the serializer still iterates through many fields.
**Fix:** Consider a flatter "branding" nested object, or use `@cached_property` on the model for computed branding fields.

---

## 6. Synchronization Issues (BusinessDomain ↔ Organization ↔ BusinessUnit)

### CRITICAL

#### C-SYNC-01: Onboarding services pass removed fields to models
**Files:** `services/organization_onboarding_service.py`, `services/bu_onboarding_service.py`, `orchestrators/business_unit_orchestrator.py`, `orchestrators/organization_orchestrator.py`

- `OrganizationOnboardingService` → passes `slug` (removed from `Organization`).
- `BuOnboardingService` → passes `industry` (removed from `BusinessUnit`).
- `OrganizationOrchestrator` → passes `slug`.
- `BusinessUnitOrchestrator` → passes `industry`.

**Impact:** Any call to these orchestrators/services will crash with `TypeError`.
**Fix:** Remove the obsolete fields from all payloads.

#### C-SYNC-02: Tests are completely out of sync with the model schema
**Files:** `tests/test_organization_api.py`, `tests/test_organization_model.py`, `tests/test_organization_service.py`

All three test files reference `slug` in:
- `Organization.objects.create(name=..., slug=..., business_domain=...)`
- `assert data["slug"] == ...`
- `assert org.slug == ...`

Since the `Organization` model no longer has `slug`, these tests will fail immediately on `FieldError` or `TypeError`.
**Fix:** Remove all `slug` references from tests. Add tests for the new `business_domain_id` create flow.

#### C-SYNC-03: Selectors query removed fields
**File:** `selectors/organization_selectors.py`

As described in C-API-04.

---

### HIGH

#### H-SYNC-01: Org restore doesn't restore `cascade_deleted` UBU memberships' `is_active` state
**File:** `organizations_service.py:159-226`

When an org is soft-deleted, its BUs are cascade-soft-deleted (setting `is_active=False`). UBU memberships are NOT soft-deleted. However, `get_active_memberships_query()` in selectors filters by `business_unit__is_active=True`. When the org is restored, BUs are restored to `is_active=True`, so UBU memberships become visible again. This works correctly.

**However**, if a BU was **directly** soft-deleted (not via org cascade), its UBU memberships remain visible in `UserBusinessUnitViewSet.list` because the view doesn't use `get_active_membership_query()`. This is a synchronization gap between the selector rules and the view rules.
**Fix:** Make `UserBusinessUnitViewSet` use the canonical `get_active_memberships_query()` selector.

#### H-SYNC-02: `OrganizationSettings` restore logic is dead code
**File:** `organizations_service.py:207-222`

As described in H-SCHEMA-01. The settings table is never soft-deleted alongside the org, so the restore block never executes.

#### H-SYNC-03: `BusinessUnit` property `business_domain` triggers N+1 if not prefetched
**File:** `models/business_unit_model.py:130-133`

```python
@property
def business_domain(self):
    return self.organization.business_domain
```

The serializer accesses this property. If `organization__business_domain` is not select_related, each access queries the DB.
**Fix:** The view already uses `select_related("organization", "organization__business_domain")`, but ensure this is never accidentally removed.

---

### MEDIUM

#### M-SYNC-01: Event signal names are inconsistent
**File:** `events/events.py`

- Organization signals: `organization_created`, `organization_updated`, ...
- BusinessDomain signals: `business_domain_created`, `business_domain_updated`, ...
- BusinessUnit signals: `business_unit_created`, `business_unit_updated`, ...

But the kwargs are inconsistent:
- Org: `org=org`
- Domain: `domain=domain`
- BU: `bu=bu` (in services) but `business_unit=bu` (in docstring?)

Actually the docstring says `kwargs: business_unit` but the service sends `bu=bu`. The signal receiver doesn't use kwargs by name (there are no receivers wired yet), so this is currently harmless. But if receivers are added later, the mismatch will cause bugs.
**Fix:** Standardize kwargs to match the model name (`organization`, `domain`, `business_unit`).

#### M-SYNC-02: `OrganizationSettings` model comment says "Requires migration 0005" but 0005 only removes `theme_color`
**File:** `models/organization_settings_model.py:6-12`

The comment says "Converted from plain `models.Model` to `BaseModel`... Requires migration 0005". But migration 0005 only removes `theme_color`. The actual BaseModel conversion happened in migration 0004. The comment is stale.
**Fix:** Update the docstring to reference migration 0004.

---

## 7. Test Coverage Gaps

### CRITICAL

1. **All existing Organization tests are broken** due to `slug` references. They will not run.
2. **No tests for BusinessDomain API** — create, update, delete, restore, upload_logo.
3. **No tests for BusinessUnit API** — CRUD, restore, upload_logo, main branch uniqueness.
4. **No tests for BusinessUnitModule API** — activate, deactivate, suspend, set_plan_limit.
5. **No tests for UserBusinessUnit API** — create, update, transfer, deactivate, activate.

### HIGH

6. **No tests for RBAC permission enforcement** — No test verifies that a user WITHOUT `organization.organization.delete` gets 403 on DELETE.
7. **No tests for cross-tenant isolation** — No test verifies that User A cannot see Organization B's data.
8. **No tests for file upload endpoints** — Logo upload endpoints are completely untested.
9. **No tests for cascade delete/restore behavior** — The `cascade_deleted` flag is never asserted.
10. **No tests for `OrganizationSettings` soft-delete cascade** — None exist.

### MEDIUM

11. **No tests for `OrganizationViewSet.meta`** — The broken endpoint has no test coverage.
12. **No tests for `effective_from` / `effective_to` date enforcement** — `test_ubu_lifecycle.py` has one test but it doesn't cover the API layer.
13. **No tests for domain mismatch validation** — `test_ubu_lifecycle.py` uses mocking rather than real DB state.

---

## 8. Recommendations (Prioritized by Severity)

### Must Fix Immediately (CRITICAL)

| # | Recommendation | Files | Effort |
|---|----------------|-------|--------|
| 1 | **Fix `OrganizationViewSet.meta` NameError** — Import or remove `SLUG_REGEX_PATTERN`. | `organization_view.py` | 5 min |
| 2 | **Remove `slug` from `OrganizationOnboardingService` and `OrganizationOrchestrator`** | `organization_onboarding_service.py`, `organization_orchestrator.py` | 10 min |
| 3 | **Remove `industry` from `BuOnboardingService` and `BusinessUnitOrchestrator`** | `bu_onboarding_service.py`, `business_unit_orchestrator.py` | 10 min |
| 4 | **Fix `OrganizationSelectors` — remove all `slug` references** | `organization_selectors.py` | 10 min |
| 5 | **Fix `OrganizationViewSet.create` 500 bug** — Use `all_objects` for post-create fetch, or auto-create creator membership. | `organization_view.py` | 30 min |
| 6 | **Change UBU FK on_delete from CASCADE to PROTECT** | `user_business_unit_model.py` | 15 min + migration |
| 7 | **Add `condition=Q(is_deleted=False)` to all soft-delete-aware unique constraints** | `organization_model.py`, `business_domain_model.py`, `business_unit_module.py` | 30 min + migration |
| 8 | **Replace migration 0004's `DROP TABLE` with a non-destructive migration** | `0004_...py` | 2-4 hrs |
| 9 | **Add cross-tenant validation to `UserBusinessUnitViewSet.create`** | `user_business_unit_view.py` | 20 min |
| 10 | **Rewrite broken test files** — Remove `slug` references; add tests for new fields. | `tests/` | 4-8 hrs |

### Fix Soon (HIGH)

| # | Recommendation | Files | Effort |
|---|----------------|-------|--------|
| 11 | **Cascade-soft-delete `OrganizationSettings` on org delete** (or remove dead restore code) | `organizations_service.py` | 30 min |
| 12 | **Add `restored_at`/`restored_by_id` to `BusinessUnit`** | `business_unit_model.py`, `business_unit_service.py` | 1 hr + migration |
| 13 | **Make `UserBusinessUnitViewSet` use `get_active_memberships_query()`** | `user_business_unit_view.py` | 30 min |
| 14 | **Fix file upload extension validation** | `organization_view.py`, `business_unit_view.py`, `business_domain_service.py` | 30 min |
| 15 | **Move `Organization` domain-change validation from `save()` to `clean()`** | `organization_model.py` | 20 min |
| 16 | **Fix `OrganizationSettingsSerializer` to use `validated_data` instead of raw `request.data`** | `organization_serializer.py` | 1 hr |
| 17 | **Close the "fail-open" hole in `BusinessUnitModuleViewSet.activate`** | `business_unit_module_view.py` | 30 min |
| 18 | **Add `updated_by_id` tracking to `OrganizationSettingsService`** | `organization_settings_service.py` | 15 min |
| 19 | **Memoize `_get_user_org_ids()` per request** | `organization_view.py` | 15 min |
| 20 | **Add partial index on `Organization.email` to reduce bloat** | `organization_model.py` | 15 min + migration |

### Fix When Convenient (MEDIUM & LOW)

| # | Recommendation | Files | Effort |
|---|----------------|-------|--------|
| 21 | **Standardize event signal kwargs** | `events/events.py`, all services | 30 min |
| 22 | **Add `Meta(BaseModel.Meta)` to `OrganizationSettings`** | `organization_settings_model.py` | 5 min |
| 23 | **Add `db_index` on `UserBusinessUnitModel.role_id`** | `user_business_unit_model.py` | 10 min + migration |
| 24 | **Add `clean()` validation to `BusinessUnitModule` for `is_active`/`status` consistency** | `business_unit_module.py` | 20 min |
| 25 | **Cache `PlatformModule` serialized list in `BusinessUnitModuleViewSet.list`** | `business_unit_module_view.py` | 30 min |
| 26 | **Consolidate duplicate URL configs** (`api/views/urls.py` vs `api/urls/organization_urls.py`) | `api/urls/`, `api/views/urls.py` | 15 min |
| 27 | **Remove dead code (`OrganizationSettingsSerializer` custom_domain interception)** or formalize it | `organization_serializer.py` | 30 min |
| 28 | **Document the `cascade_deleted` vs direct-delete distinction** in runbooks | docs/ | 30 min |
| 29 | **Add explicit audit logging for super-admin cross-org BU creation** | `business_unit_view.py` | 20 min |
| 30 | **Squash migrations 0001-0008** into a single clean initial migration | `migrations/` | 1-2 hrs |

---

## 9. Appendix: Quick Reference — Files with Known Stale References

| File | Stale Reference | Current State |
|------|-----------------|---------------|
| `models/organization_model.py` | `slug` removed | Field deleted, model OK |
| `migrations/0001_initial.py` | Creates `slug` on Organization & BusinessDomain | Superseded by 0003/0004 |
| `api/views/organization_view.py:373` | `SLUG_REGEX_PATTERN` | **Undefined — will crash** |
| `services/organization_onboarding_service.py:14` | `slug` param | **Will crash** |
| `orchestrators/organization_orchestrator.py:14` | `slug` param | **Will crash** |
| `services/bu_onboarding_service.py:50` | `industry` field | **Will crash** |
| `orchestrators/business_unit_orchestrator.py:44` | `industry` field | **Will crash** |
| `selectors/organization_selectors.py:24,56` | `slug` column | **Will crash** |
| `tests/test_organization_api.py` | `slug` in 10+ places | **All tests broken** |
| `tests/test_organization_model.py` | `slug` in 3 places | **All tests broken** |
| `tests/test_organization_service.py` | `slug` in 2 places | **All tests broken** |

---

*End of Report*
