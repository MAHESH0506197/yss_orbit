from __future__ import annotations
import logging
import os
import uuid
from typing import Any

from django.conf import settings as django_settings
from django.db import transaction
from django.utils import timezone

from apps.platform.core_exceptions import ValidationException, ResourceNotFoundException
from apps.organization.models import BusinessDomain, Organization
from apps.organization.events.events import (
    business_domain_created,
    business_domain_updated,
    business_domain_deleted,
    business_domain_restored,
    business_domain_permanently_deleted,
)

logger = logging.getLogger(__name__)

class BusinessDomainService:
    """Stateless service class. Owns all Business Domain business logic."""

    def get_domain(self, domain_id: uuid.UUID) -> BusinessDomain:
        try:
            return BusinessDomain.objects.get(id=domain_id, is_deleted=False)
        except BusinessDomain.DoesNotExist:
            raise ResourceNotFoundException(f"Business Domain {domain_id} not found.")

    def get_domain_including_deleted(self, domain_id: uuid.UUID) -> BusinessDomain:
        try:
            return BusinessDomain.all_objects.get(id=domain_id)
        except BusinessDomain.DoesNotExist:
            raise ResourceNotFoundException(f"Business Domain {domain_id} not found.")

    @transaction.atomic
    def create_domain(self, data: dict[str, Any], created_by_id: uuid.UUID | None = None) -> BusinessDomain:
        reason = data.pop("reason", "")
        domain = BusinessDomain(**data)
        domain.created_by_id = created_by_id
        domain.updated_by_id = created_by_id
        if reason:
            domain.created_reason = reason
            domain.updated_reason = reason
        domain.save()

        try:
            business_domain_created.send(sender=BusinessDomain, domain=domain)
        except Exception as exc:
            logger.warning("Failed to send business_domain_created event: %s", exc)

        return domain

    @transaction.atomic
    def update_domain(self, domain_id: uuid.UUID, data: dict[str, Any], updated_by_id: uuid.UUID | None = None) -> BusinessDomain:
        domain = self.get_domain_including_deleted(domain_id)
        
        # Prevent deactivation if domain has assigned active organizations
        new_is_active = data.get("is_active", domain.is_active)
        if domain.is_active and not new_is_active:
            org_count = Organization.objects.filter(business_domain=domain, is_deleted=False).count()
            if org_count > 0:
                raise ValidationException(f"Cannot deactivate domain — {org_count} Organization(s) are still assigned to it.")

        reason = data.pop("reason", None)
        if reason is not None:
            domain.updated_reason = reason

        for field, value in data.items():
            setattr(domain, field, value)
        
        domain.updated_by_id = updated_by_id
        domain.save()

        try:
            business_domain_updated.send(sender=BusinessDomain, domain=domain)
        except Exception as exc:
            logger.warning("Failed to send business_domain_updated event: %s", exc)

        return domain

    @transaction.atomic
    def soft_delete_domain(self, domain_id: uuid.UUID, deleted_by_id: uuid.UUID | None = None, reason: str = "") -> None:
        domain = self.get_domain(domain_id)

        # Ensure no active organizations are using this domain before archiving
        active_org_count = Organization.objects.filter(business_domain=domain, is_deleted=False).count()
        if active_org_count > 0:
            raise ValidationException(
                f"Cannot archive this domain — {active_org_count} active Organization(s) "
                "are still assigned to it. Reassign or archive them first."
            )

        domain.soft_delete(deleted_by_id=deleted_by_id)
        if reason:
            domain.deleted_reason = reason
            domain.save(update_fields=['deleted_reason'])
        
        try:
            business_domain_deleted.send(sender=BusinessDomain, domain=domain)
        except Exception as exc:
            logger.warning("Failed to send business_domain_deleted event: %s", exc)

    @transaction.atomic
    def restore_domain(self, domain_id: uuid.UUID, restored_by_id: uuid.UUID | None = None, reason: str = "") -> BusinessDomain:
        try:
            domain = BusinessDomain.all_objects.get(id=domain_id, is_deleted=True)
        except BusinessDomain.DoesNotExist:
            raise ResourceNotFoundException("Business Domain not found or not archived.")

        domain.restore()
        now = timezone.now()
        domain.restored_at     = now
        domain.restored_by_id  = restored_by_id
        # ENTERPRISE AUDIT (SYNC-06 FIX): Save restored_reason unconditionally,
        # not just when non-empty. Aligns with OrganizationService.restore_organization().
        domain.restored_reason = reason
        domain.deleted_reason  = ""  # Clear deletion reason on restore
        domain.save(update_fields=[
            "is_deleted", "is_active", "deleted_at", "deleted_by_id", "deleted_reason",
            "restored_at", "restored_by_id", "restored_reason", "updated_at",
        ])

        try:
            business_domain_restored.send(sender=BusinessDomain, domain=domain)
        except Exception as exc:
            logger.warning("Failed to send business_domain_restored event: %s", exc)
            
        return domain

    @transaction.atomic
    def hard_delete_domain(self, domain_id: uuid.UUID, deleted_by_id: uuid.UUID | None = None) -> None:
        """
        Permanently deletes an archived domain. Validates that no organizations (even archived) are attached,
        otherwise deleting the domain will trigger a DB RestrictedError and 500 crash.
        """
        try:
            domain = BusinessDomain.all_objects.get(id=domain_id)
        except BusinessDomain.DoesNotExist:
            return  # Already deleted
            
        if not domain.is_deleted:
            raise ValidationException("Domain must be archived (soft-deleted) before it can be permanently deleted.")

        # VALIDATION BUGFIX: Prevent 500 RESTRICT error if archived organizations exist
        org_count = Organization.all_objects.filter(business_domain=domain).count()
        if org_count > 0:
            raise ValidationException(
                f"Cannot permanently delete this domain — {org_count} archived Organization(s) "
                "are still assigned to it. Permanently delete those organizations first."
            )

        domain_name = domain.name
        domain_code = domain.code

        # Clean up logo file before deleting the DB record
        if domain.logo_url:
            try:
                old_rel = domain.logo_url.split(django_settings.MEDIA_URL, 1)[-1].lstrip("/")
                old_abs = os.path.join(django_settings.MEDIA_ROOT, old_rel)
                if os.path.isfile(old_abs):
                    os.remove(old_abs)
                    logger.info("Hard delete: removed logo file for domain %s (%s): %s", domain_code, domain.id, old_abs)
                parent_dir = os.path.dirname(old_abs)
                if os.path.isdir(parent_dir) and not os.listdir(parent_dir):
                    os.rmdir(parent_dir)
            except Exception as exc:
                logger.warning("Hard delete: could not remove logo file for domain %s (%s): %s", domain_code, domain.id, exc)

        domain.delete()
        logger.info(
            "Hard delete: permanently deleted BusinessDomain '%s' (%s) by user %s",
            domain_name, domain_code, deleted_by_id or "unknown",
        )

        try:
            business_domain_permanently_deleted.send(
                sender=BusinessDomain,
                domain_name=domain_name,
                domain_code=domain_code,
            )
        except Exception as exc:
            logger.warning("Failed to send business_domain_permanently_deleted event: %s", exc)

    @transaction.atomic
    def upload_logo(self, domain_id: uuid.UUID, logo_file: Any, updated_by_id: uuid.UUID | None = None) -> str:
        """Upload and store domain logo. Uses shared media_utils for DRY file handling."""
        from core.utils.media_utils import save_logo_file, ValidationException as MediaValidationError

        domain = self.get_domain(domain_id)
        try:
            logo_url = save_logo_file(
                file=logo_file,
                entity_type="domain_logos",
                entity_id=str(domain.id),
                old_logo_url=domain.logo_url,
            )
        except ValueError as exc:
            raise ValidationException(str(exc))

        domain.logo_url = logo_url
        domain.updated_by_id = updated_by_id
        domain.save(update_fields=["logo_url", "updated_at", "updated_by_id"])
        return logo_url

    @transaction.atomic
    def hard_delete_domain_logo(self, domain_id: uuid.UUID) -> None:
        """Remove the logo file from disk if it exists."""
        from core.utils.media_utils import delete_logo_file
        domain = self.get_domain(domain_id)
        if domain.logo_url:
            delete_logo_file(domain.logo_url)
            domain.logo_url = None
            domain.save(update_fields=["logo_url", "updated_at"])
