# yss_orbit/backend/apps/organization/repositories/organization_repository.py
from __future__ import annotations

import uuid

from apps.organization.models import Organization, OrganizationSettings


class OrganizationRepository:
    @staticmethod
    def get_by_id(org_id: uuid.UUID) -> Organization:
        return Organization.objects.select_related("settings").get(
            id=org_id, is_deleted=False
        )

    @staticmethod
    def update_status(org_id: uuid.UUID, is_active: bool) -> Organization:
        org = Organization.objects.get(id=org_id)
        org.is_active = is_active
        org.save(update_fields=["is_active", "updated_at"])
        return org

    @staticmethod
    def create_with_settings(org: Organization) -> Organization:
        """Save organization and auto-provision its settings."""
        org.save()
        OrganizationSettings.objects.get_or_create(organization=org)
        return org

    @staticmethod
    def list_active() -> list[Organization]:
        """Return active, non-deleted orgs for dropdowns."""
        return list(
            Organization.objects.filter(is_deleted=False, is_active=True)
            .only("id", "name")
            .order_by("name")
        )
