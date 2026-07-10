# apps/organization/services/business_unit_service.py
"""
YSS Orbit — Business Unit Service
Business logic layer for all BusinessUnit lifecycle operations.
Now fires lifecycle signals to match Organization module parity.

ENTERPRISE AUDIT FIXES:
  ✅ C-01/C-02: delete_business_unit() now accepts reason param and persists it.
  ✅ Added restored_at, restored_by_id, restored_reason to restore_business_unit()
     (new model fields — must match the migration 0009).
  ✅ restore_business_unit() clears deleted_reason on restore.
  ✅ create_business_unit() now checks name_exists() for defense-in-depth with
     IntegrityError wrapper as a final race-condition safeguard.
"""
from __future__ import annotations

import logging
import uuid
from typing import Any

from django.db import transaction, IntegrityError
from django.utils import timezone

from apps.platform.core_exceptions import ValidationException, ResourceNotFoundException
from apps.iam.security_context import SecurityContext
from apps.organization.models import BusinessUnit
from apps.organization.repositories.business_unit_repository import BusinessUnitRepository

logger = logging.getLogger(__name__)


class BusinessUnitService:
    """
    Stateless service class. Owns all BusinessUnit business logic.
    Fires Django signals on create / update / delete / restore for
    event-driven extensibility (mirrors OrganizationService).
    """

    # ─── Queries ──────────────────────────────────────────────────────────────
    def get_business_unit(
        self,
        bu_id: uuid.UUID,
        org_id: uuid.UUID | None = None,
    ) -> BusinessUnit:
        try:
            return BusinessUnitRepository.get_by_id(bu_id, org_id=org_id)
        except BusinessUnit.DoesNotExist:
            raise ResourceNotFoundException(f"Business Unit {bu_id} not found.")

    # ─── Create ───────────────────────────────────────────────────────────────
    @transaction.atomic
    def create_business_unit(
        self,
        security_context: SecurityContext | None,
        data: dict[str, Any],
    ) -> BusinessUnit:
        from apps.organization.events.events import business_unit_created

        # Resolve org_id
        org_id = data.get("organization_id") or (
            data.get("organization").id if data.get("organization") else None
        )
        code = data.get("code", "").upper().strip()
        data["code"] = code

        # Unique code check within the org
        if org_id and BusinessUnitRepository.code_exists(org_id, code):
            raise ValidationException(
                f"A business unit with code '{code}' already exists in this organization."
            )

        # Defense-in-depth: name uniqueness check in service layer (serializer is first guard,
        # this catches concurrent requests that both passed serializer validation).
        name = data.get("name", "")
        if name and org_id:
            if BusinessUnitRepository.name_exists(org_id, name):
                raise ValidationException(
                    f"A business unit named '{name}' already exists in this organization."
                )

        # Main branch check: only one allowed per org.
        # select_for_update() prevents a race condition where two concurrent
        # requests both pass the check and both become is_main_branch=True.
        if data.get("is_main_branch") and org_id:
            from apps.organization.models import Organization
            # Acquire row-level lock on the org row to serialize concurrent writes
            Organization.objects.select_for_update().filter(id=org_id).exists()
            if BusinessUnitRepository.has_main_branch(org_id):
                raise ValidationException(
                    "This organization already has a main branch. "
                    "Only one main branch is allowed per organization."
                )

        # Extract branding mode (write-only field — not a model column)
        branding_mode = data.pop("branding_mode", None)
        custom_domain = data.pop("custom_domain", None)
        reason = data.pop("reason", "")

        bu = BusinessUnit(**data)
        user_id = security_context.effective_user_id if security_context else None
        bu.created_by_id = user_id
        bu.updated_by_id = user_id
        if reason:
            bu.created_reason = reason
            bu.updated_reason = reason
        try:
            bu.save()
        except IntegrityError as exc:
            exc_str = str(exc)
            if "unique_bu_name_per_org" in exc_str:
                raise ValidationException(
                    f"A business unit named '{name}' already exists in this organization."
                ) from exc
            if "unique_bu_code_per_org" in exc_str:
                raise ValidationException(
                    f"A business unit with code '{code}' already exists in this organization."
                ) from exc
            raise

        # Handle branding override if provided
        if branding_mode:
            from apps.platform.models.brand_configuration import BrandConfiguration
            BrandConfiguration.objects.create(
                organization_id=org_id,
                business_unit=bu,
                branding_mode=branding_mode,
                custom_domain=custom_domain or None,
                logo_url=data.get("logo_url", ""),
                domain_status='pending',
                ssl_status='pending',
                created_by_id=user_id,
                updated_by_id=user_id,
            )

        # Fire lifecycle signal
        business_unit_created.send(sender=BusinessUnit, bu=bu)

        logger.info("BusinessUnit created: %s (id=%s)", bu.name, bu.id)
        return bu

    # ─── Update ───────────────────────────────────────────────────────────────
    @transaction.atomic
    def update_business_unit(
        self,
        security_context: SecurityContext | None,
        bu_id: uuid.UUID,
        data: dict[str, Any],
        org_id: uuid.UUID | None = None,
    ) -> BusinessUnit:
        from apps.organization.events.events import business_unit_updated

        bu = self.get_business_unit(bu_id, org_id=org_id)

        # Extract branding mode
        branding_mode = data.pop("branding_mode", None)
        custom_domain_override = data.pop("custom_domain", None)
        domain_status_override = data.pop("domain_status", None)
        ssl_status_override = data.pop("ssl_status", None)
        reason = data.pop("reason", "")

        # Code uniqueness check on change
        new_code = data.get("code")
        if new_code:
            new_code = new_code.upper().strip()
            data["code"] = new_code
            if BusinessUnitRepository.code_exists(
                bu.organization_id, new_code, exclude_id=bu_id
            ):
                raise ValidationException(
                    f"A business unit with code '{new_code}' already exists in this organization."
                )

        # Main branch uniqueness check.
        # select_for_update() prevents a race condition on concurrent updates.
        if data.get("is_main_branch") and not bu.is_main_branch:
            from apps.organization.models import Organization
            Organization.objects.select_for_update().filter(id=bu.organization_id).exists()
            if BusinessUnitRepository.has_main_branch(bu.organization_id, exclude_id=bu_id):
                raise ValidationException(
                    "This organization already has a main branch. "
                    "Only one main branch is allowed per organization."
                )

        # Keep track if we need to update BrandConfig logo/color
        logo_url_override = data.get("logo_url")

        for field, value in data.items():
            if field not in ["logo_url"]:
                setattr(bu, field, value)
        user_id = security_context.effective_user_id if security_context else None
        bu.updated_by_id = user_id
        if reason:
            bu.updated_reason = reason
        bu.save()

        # Handle branding override update
        if branding_mode:
            from apps.platform.models.brand_configuration import BrandConfiguration
            config, created = BrandConfiguration.objects.get_or_create(
                business_unit=bu,
                defaults={"created_by_id": user_id, "organization_id": bu.organization_id},
            )
            config.branding_mode = branding_mode
            if logo_url_override is not None:
                config.logo_url = logo_url_override

            if custom_domain_override is not None:
                new_domain = custom_domain_override or None
                if config.custom_domain != new_domain:
                    config.custom_domain = new_domain
                    config.domain_status = 'pending'
                    config.ssl_status = 'pending'
            if domain_status_override is not None:
                config.domain_status = domain_status_override
            if ssl_status_override is not None:
                config.ssl_status = ssl_status_override
                
            config.updated_by_id = user_id
            config.save(update_fields=["branding_mode", "logo_url", "custom_domain", "domain_status", "ssl_status", "updated_by_id", "updated_at"])

        # Fire lifecycle signal
        business_unit_updated.send(sender=BusinessUnit, bu=bu)

        logger.info("BusinessUnit updated: %s (id=%s)", bu.name, bu.id)
        return bu

    # ─── Soft Delete ───────────────────────────────────────────────────────────
    @transaction.atomic
    def delete_business_unit(
        self,
        security_context: SecurityContext | None,
        bu_id: uuid.UUID,
        org_id: uuid.UUID | None = None,
        reason: str = "",
    ) -> None:
        """
        Direct soft-delete of a single Business Unit.
        Sets cascade_deleted=False (distinguishes from org-cascade-deleted BUs).

        C-01/C-02 FIX: `reason` is now accepted and persisted to deleted_reason.
        Previously the service unconditionally set deleted_reason = "" regardless
        of what the view passed.
        """
        from apps.organization.events.events import business_unit_deleted

        bu = self.get_business_unit(bu_id, org_id=org_id)
        now = timezone.now()
        user_id = security_context.effective_user_id if security_context else None

        bu.is_deleted      = True
        bu.is_active       = False
        bu.deleted_at      = now
        bu.deleted_by_id   = user_id
        bu.deleted_reason  = reason or ""  # C-01 FIX: persist caller-supplied reason
        bu.cascade_deleted = False  # direct delete, NOT cascade
        bu.updated_by_id   = user_id
        bu.save(update_fields=[
            "is_deleted", "is_active", "deleted_at",
            "deleted_by_id", "deleted_reason", "cascade_deleted", "updated_by_id", "updated_at",
        ])

        # Fire lifecycle signal (pass bu snapshot before it disappears from default queryset)
        business_unit_deleted.send(sender=BusinessUnit, bu=bu)

        logger.info("BusinessUnit soft-deleted (direct): %s (id=%s)", bu.name, bu.id)

    @transaction.atomic
    def cascade_delete_business_unit(
        self,
        security_context: SecurityContext | None,
        bu_id: uuid.UUID,
    ) -> None:
        """
        2.2 fix: Cascade soft-delete — called when parent Organization is deleted.
        Sets cascade_deleted=True so restore_organization() can selectively
        restore only BUs that were cascade-deleted (not directly deleted ones).
        """
        try:
            bu = BusinessUnit.all_objects.get(id=bu_id, is_deleted=False)
        except BusinessUnit.DoesNotExist:
            return  # Already deleted, skip

        now = timezone.now()
        user_id = security_context.effective_user_id if security_context else None
        bu.is_deleted      = True
        bu.is_active       = False
        bu.deleted_at      = now
        bu.deleted_by_id   = user_id
        bu.cascade_deleted = True  # 2.2 fix: marks this as org-cascade deletion
        bu.updated_by_id = user_id
        bu.save(update_fields=[
            "is_deleted", "is_active", "deleted_at",
            "deleted_by_id", "cascade_deleted", "updated_by_id", "updated_at",
        ])
        
        # Fire lifecycle signal to cascade to RBAC/UBU
        from apps.organization.events.events import business_unit_deleted
        business_unit_deleted.send(sender=BusinessUnit, bu=bu)
        
        logger.info("BusinessUnit cascade-deleted: %s (id=%s)", bu.name, bu.id)


    # ─── Restore ───────────────────────────────────────────────────────────
    @transaction.atomic
    def restore_business_unit(
        self,
        security_context: SecurityContext | None,
        bu_id: uuid.UUID,
        org_id: uuid.UUID | None = None,
    ) -> BusinessUnit:
        from apps.organization.events.events import business_unit_restored

        try:
            bu = BusinessUnitRepository.get_by_id_including_deleted(bu_id, org_id=org_id)
        except BusinessUnit.DoesNotExist:
            raise ResourceNotFoundException(f"Business Unit {bu_id} not found.")

        if not bu.is_deleted:
            raise ValidationException("Business Unit is not deleted.")

        now = timezone.now()
        user_id = security_context.effective_user_id if security_context else None

        bu.is_deleted      = False
        bu.is_active       = True
        bu.deleted_at      = None
        bu.deleted_by_id   = None
        bu.deleted_reason  = ""  # Clear deletion reason on restore
        bu.cascade_deleted = False  # Clear cascade flag on restore
        bu.updated_by_id   = user_id
        # ENTERPRISE AUDIT: Set restore audit fields (parity with BusinessDomain + Organization).
        bu.restored_at     = now
        bu.restored_by_id  = user_id
        bu.restored_reason = ""
        bu.save(update_fields=[
            "is_deleted", "is_active", "deleted_at",
            "deleted_by_id", "deleted_reason", "cascade_deleted",
            "restored_at", "restored_by_id", "restored_reason",
            "updated_by_id", "updated_at",
        ])

        # Fire lifecycle signal
        business_unit_restored.send(sender=BusinessUnit, bu=bu)

        logger.info("BusinessUnit restored: %s (id=%s)", bu.name, bu.id)
        return bu
