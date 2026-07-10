# yss_orbit/backend/apps/business_unit/repositories/business_unit_repository.py
"""
YSS Orbit — Business Unit Repository
Data-access layer. All queries for BusinessUnit live here.
"""
from __future__ import annotations

import uuid
from typing import Any

from django.db.models import QuerySet

from apps.organization.models import BusinessUnit


class BusinessUnitRepository:

    @staticmethod
    def get_by_id(bu_id: uuid.UUID, org_id: uuid.UUID | None = None) -> BusinessUnit:
        """Fetch a single active BU, optionally scoped to an org."""
        qs = BusinessUnit.objects.select_related("organization").filter(
            id=bu_id, is_deleted=False
        )
        if org_id:
            qs = qs.filter(organization_id=org_id)
        return qs.get()

    @staticmethod
    def get_by_id_including_deleted(
        bu_id: uuid.UUID,
        org_id: uuid.UUID | None = None,
    ) -> BusinessUnit:
        """Fetch a BU regardless of soft-delete state.
        MUST use all_objects — the default objects manager (SoftDeleteManager)
        silently excludes is_deleted=True records.
        """
        qs = BusinessUnit.all_objects.filter(id=bu_id)
        if org_id:
            qs = qs.filter(organization_id=org_id)
        try:
            return qs.get()
        except BusinessUnit.DoesNotExist:
            raise

    @staticmethod
    def get_by_code(org_id: uuid.UUID, code: str) -> BusinessUnit | None:
        """Find a non-deleted BU by its code within an org."""
        return BusinessUnit.objects.filter(
            organization_id=org_id,
            code=code,
            is_deleted=False,
        ).first()

    @staticmethod
    def code_exists(
        org_id: uuid.UUID,
        code: str,
        exclude_id: uuid.UUID | None = None,
    ) -> bool:
        """Check if a code is already used within an org."""
        qs = BusinessUnit.objects.filter(
            organization_id=org_id,
            code=code,
            is_deleted=False,
        )
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        return qs.exists()

    @staticmethod
    def name_exists(
        org_id: uuid.UUID,
        name: str,
        exclude_id: uuid.UUID | None = None,
    ) -> bool:
        """Check if a name is already used within an org."""
        qs = BusinessUnit.objects.filter(
            organization_id=org_id,
            name__iexact=name,
            is_deleted=False,
        )
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        return qs.exists()
    @staticmethod
    def list_by_org(org_id: uuid.UUID, include_deleted: bool = False) -> QuerySet:
        """Return all BUs for an org, optionally including deleted."""
        manager = BusinessUnit.all_objects if include_deleted else BusinessUnit.objects
        qs = manager.filter(organization_id=org_id)
        if not include_deleted:
            qs = qs.filter(is_deleted=False)
        return qs.order_by("name")

    @staticmethod
    def has_main_branch(org_id: uuid.UUID, exclude_id: uuid.UUID | None = None) -> bool:
        """Check whether an org already has a main branch."""
        qs = BusinessUnit.objects.filter(
            organization_id=org_id,
            is_main_branch=True,
            is_deleted=False,
        )
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        return qs.exists()
