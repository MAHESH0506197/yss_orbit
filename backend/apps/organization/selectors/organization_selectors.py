# yss_orbit/backend/apps/organization/selectors/organization_selectors.py
"""
Read-only query helpers for the Organization model.
No business logic — just querysets.
"""
from __future__ import annotations

from django.db.models import Q, QuerySet

from apps.organization.models import Organization


class OrganizationSelectors:

    @staticmethod
    def get_by_id(org_id) -> Organization:
        return (
            Organization.objects
            .select_related("settings")
            .get(id=org_id, is_deleted=False)
        )

    @staticmethod
    def get_by_name(name: str) -> Organization | None:
        return (
            Organization.objects
            .filter(name=name, is_deleted=False)
            .select_related("settings")
            .first()
        )

    @staticmethod
    def get_active() -> QuerySet:
        return (
            Organization.objects
            .filter(is_active=True, is_deleted=False)
            .order_by("name")
        )

    @staticmethod
    def get_all_non_deleted() -> QuerySet:
        """All non-deleted organizations regardless of active status."""
        return (
            Organization.objects
            .filter(is_deleted=False)
            .order_by("name")
        )

    @staticmethod
    def search(term: str) -> QuerySet:
        """Search by name or email. Slug removed from model."""
        return (
            Organization.objects
            .filter(
                Q(name__icontains=term)
                | Q(email__icontains=term),
                is_deleted=False,
            )
            .order_by("name")
        )
