# apps/organization/organizations_service.py
"""
YSS Orbit — Organization Service

All Organization business logic lives here. Stateless service class.
All operations are wrapped in @transaction.atomic.

ENTERPRISE AUDIT CHANGES:
  ✅ CRITICAL C-01 FIX: reason popped from data BEFORE Organization(**data) is built.
     Previous code popped AFTER model init → reason key was passed to __init__
     as an unexpected kwarg → TypeError on every org create with reason field.
  ✅ A-05 FIX: restore_organization() now fires per-BU signals via BusinessUnitService
     instead of silently bypassing all signal handlers with queryset.update().
  ✅ Cascade BU restore now uses BusinessUnitService to properly fire signals.
  ✅ deleted_reason cleared on restore (was previously left populated).
  ✅ restore_organization() sets restored_at + restored_by_id (Enterprise Audit parity).
  ✅ permanently_delete_organization() added (Q2 approval).
  ✅ Event imports now use the fixed events.py with proper Django signals.
  ✅ create_organization() / update_organization() no longer handle slug.

FIX-BUG04: Stats scoped to user's accessible orgs (in view, not service).
FIX-BUG07: Cascade delete uses per-BU BusinessUnitService call to correctly set
cascade_deleted=True. Org restore only restores cascade-deleted BUs, not
directly-deleted ones.
"""
from __future__ import annotations
import logging
import uuid
from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.platform.core_exceptions import ValidationException, ResourceNotFoundException
from apps.organization.models import Organization, OrganizationSettings

logger = logging.getLogger(__name__)


class OrganizationService:
    """Stateless service class. Owns all Organization business logic."""

    def get_organization(self, org_id: uuid.UUID) -> Organization:
        try:
            return Organization.objects.get(id=org_id, is_deleted=False)
        except Organization.DoesNotExist:
            raise ResourceNotFoundException(f"Organization {org_id} not found.")

    def get_organization_including_deleted(self, org_id: uuid.UUID) -> Organization:
        try:
            return Organization.all_objects.get(id=org_id)
        except Organization.DoesNotExist:
            raise ResourceNotFoundException(f"Organization {org_id} not found.")

    def list_organizations(self) -> list[Organization]:
        return list(Organization.objects.filter(is_deleted=False).order_by("name"))

    @transaction.atomic
    def create_organization(
        self,
        data: dict[str, Any],
        created_by_id: uuid.UUID | None = None,
    ) -> Organization:
        from apps.organization.events.events import organization_created

        # CRITICAL C-01 FIX: Pop reason BEFORE passing data to Organization(**data).
        # Previously, the pop happened after model instantiation — so 'reason' was
        # passed into Organization.__init__() as an unexpected kwarg → TypeError.
        reason = data.pop("reason", "")

        org = Organization(**data)
        if created_by_id:
            org.created_by_id = created_by_id
            org.updated_by_id = created_by_id
        if reason:
            org.created_reason = reason
            org.updated_reason = reason
        org.save()
        OrganizationSettings.objects.get_or_create(organization=org)
        organization_created.send(sender=Organization, org=org)
        logger.info("Organization created: %s (id=%s)", org.name, org.id)
        return org

    @transaction.atomic
    def update_organization(
        self,
        org_id: uuid.UUID,
        data: dict[str, Any],
        updated_by_id: uuid.UUID | None = None,
    ) -> Organization:
        from apps.organization.events.events import organization_updated
        org = self.get_organization(org_id)

        # Pop reason before iterating data fields to avoid setattr on non-model field.
        reason = data.pop("reason", None)
        if reason is not None:
            org.updated_reason = reason

        for field, value in data.items():
            setattr(org, field, value)

        if updated_by_id:
            org.updated_by_id = updated_by_id
        org.save()
        organization_updated.send(sender=Organization, org=org)
        logger.info("Organization updated: %s (id=%s)", org.name, org.id)
        return org

    @transaction.atomic
    def delete_organization(
        self,
        org_id: uuid.UUID,
        deleted_by_id: uuid.UUID | None = None,
        reason: str = "",
    ) -> None:
        from apps.organization.events.events import organization_deleted
        org = self.get_organization(org_id)

        # Soft-delete the organization
        now = timezone.now()
        org.is_deleted     = True
        org.is_active      = False
        org.deleted_at     = now
        org.deleted_by_id  = deleted_by_id
        org.deleted_reason = reason
        if deleted_by_id:
            org.updated_by_id = deleted_by_id
        org.save(update_fields=[
            "is_deleted", "is_active", "deleted_at", "deleted_by_id", "deleted_reason", "updated_by_id", "updated_at"
        ])

        # FIX-BUG07: Cascade delete using BusinessUnitService per-BU to set cascade_deleted=True.
        # Previously used queryset.update() which bypassed the cascade_deleted flag,
        # making cascade-deleted BUs indistinguishable from directly-deleted BUs.
        try:
            from apps.organization.models import BusinessUnit
            from apps.organization.services.business_unit_service import BusinessUnitService
            from apps.iam.security_context import SecurityContext

            system_ctx = SecurityContext(
                user_id=deleted_by_id or uuid.UUID(int=0),
                business_unit_id=uuid.UUID(int=0),
                correlation_id="org-cascade-delete",
                is_super_admin=True,
            )
            bu_service = BusinessUnitService()
            active_bu_ids = list(
                BusinessUnit.objects
                .filter(organization=org, is_deleted=False)
                .values_list("id", flat=True)
            )
            for bu_id in active_bu_ids:
                try:
                    bu_service.cascade_delete_business_unit(
                        security_context=system_ctx,
                        bu_id=bu_id,
                    )
                except Exception as bu_err:
                    logger.warning("BU %s cascade delete failed: %s", bu_id, bu_err)
            logger.info("Cascade-deleted %d BUs for org %s", len(active_bu_ids), org_id)
        except Exception as exc:
            # BU cascade failure must NOT roll back org soft-delete
            logger.exception("BU cascade delete partially failed for org %s: %s", org_id, exc)

        organization_deleted.send(sender=Organization, org=org)
        logger.info("Organization soft-deleted: %s (id=%s)", org.name, org.id)

    @transaction.atomic
    def restore_organization(
        self,
        org_id: uuid.UUID,
        restored_by_id: uuid.UUID | None = None,
        reason: str = "",
    ) -> Organization:
        from apps.organization.events.events import organization_restored
        try:
            org = Organization.all_objects.get(id=org_id, is_deleted=True)
        except Organization.DoesNotExist:
            raise ResourceNotFoundException(f"Deleted organization {org_id} not found.")

        now = timezone.now()
        org.is_deleted      = False
        org.is_active       = True
        org.deleted_at      = None
        org.deleted_by_id   = None
        org.deleted_reason  = ""  # Clear deletion reason on restore
        # Enterprise Audit: set restored_at + restored_by_id (parity with BusinessDomain)
        org.restored_at     = now
        org.restored_by_id  = restored_by_id
        org.restored_reason = reason
        if restored_by_id:
            org.updated_by_id = restored_by_id
        org.save(update_fields=[
            "is_deleted", "is_active", "deleted_at", "deleted_by_id", "deleted_reason",
            "restored_at", "restored_by_id", "restored_reason", "updated_by_id", "updated_at"
        ])

        # A-05 FIX: Restore cascade-deleted BUs via BusinessUnitService per-BU
        # so that Django signals (RBAC restoration, UBU reactivation) are properly fired.
        # Previously used queryset.update() which bypassed all signal handlers entirely.
        try:
            from apps.organization.models import BusinessUnit
            from apps.organization.services.business_unit_service import BusinessUnitService
            from apps.iam.security_context import SecurityContext

            system_ctx = SecurityContext(
                user_id=restored_by_id or uuid.UUID(int=0),
                business_unit_id=uuid.UUID(int=0),
                correlation_id="org-cascade-restore",
                is_super_admin=True,
            )
            bu_service = BusinessUnitService()
            cascade_bu_ids = list(
                BusinessUnit.all_objects
                .filter(organization=org, is_deleted=True, cascade_deleted=True)
                .values_list("id", flat=True)
            )
            for bu_id in cascade_bu_ids:
                try:
                    bu_service.restore_business_unit(
                        security_context=system_ctx,
                        bu_id=bu_id,
                    )
                except Exception as bu_err:
                    logger.warning("BU %s cascade restore failed: %s", bu_id, bu_err)
            logger.info("Cascade-restored %d BUs for org %s", len(cascade_bu_ids), org_id)
        except Exception as exc:
            logger.exception("BU cascade restore failed for org %s: %s", org_id, exc)

        # Restore OrganizationSettings if it was soft-deleted alongside the org.
        try:
            from apps.organization.models import OrganizationSettings
            restored_settings = OrganizationSettings.all_objects.filter(
                organization=org, is_deleted=True
            ).update(
                is_deleted=False,
                is_active=True,
                deleted_at=None,
                deleted_by_id=None,
                updated_at=now,
            )
            if restored_settings:
                logger.info("Restored %d OrganizationSettings rows for org %s", restored_settings, org_id)
        except Exception as exc:
            logger.exception("OrganizationSettings restore failed for org %s: %s", org_id, exc)

        organization_restored.send(sender=Organization, org=org)
        logger.info("Organization restored: %s (id=%s)", org.name, org.id)
        return org

    @transaction.atomic
    def permanently_delete_organization(
        self,
        org_id: uuid.UUID,
        org_name: str,
        logo_url: str | None = None,
    ) -> None:
        """
        Hard delete an organization and all its children.
        Only callable after the org has been soft-deleted.
        Super-admin only (enforced at view level).
        """
        from apps.organization.events.events import organization_permanently_deleted
        from core.utils.media_utils import delete_logo_file

        try:
            org = Organization.all_objects.get(id=org_id, is_deleted=True)
        except Organization.DoesNotExist:
            raise ResourceNotFoundException(
                f"Archived organization {org_id} not found for permanent deletion."
            )

        # Clean up org logo from disk
        if logo_url:
            delete_logo_file(logo_url)

        # Clean up all BU logo files before the DB cascade removes BU rows.
        try:
            from apps.organization.models import BusinessUnit
            bu_logo_urls = list(
                BusinessUnit.all_objects.filter(organization=org)
                .exclude(logo_url__isnull=True)
                .exclude(logo_url="")
                .values_list("logo_url", flat=True)
            )
            for bu_logo_url in bu_logo_urls:
                delete_logo_file(bu_logo_url)
            logger.info("Cleaned up %d BU logo(s) for org %s", len(bu_logo_urls), org_id)
        except Exception as exc:
            logger.warning("BU logo cleanup step failed for org %s: %s", org_id, exc)

        # Hard delete (Django cascade handles related objects per their FK on_delete setting)
        org.delete()

        organization_permanently_deleted.send(
            sender=Organization,
            org_id=str(org_id),
            org_name=org_name,
        )
        logger.info("Organization permanently deleted: %s (id=%s)", org_name, org_id)

    @transaction.atomic
    def update_settings(
        self,
        org_id: uuid.UUID,
        settings_data: dict[str, Any],
        updated_by_id: uuid.UUID | None = None,
    ) -> OrganizationSettings:
        org = self.get_organization(org_id)
        settings, _ = OrganizationSettings.objects.get_or_create(organization=org)
        for field, value in settings_data.items():
            setattr(settings, field, value)
        settings.save()
        return settings
