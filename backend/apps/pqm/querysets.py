# yss_orbit\backend\apps\pqm\querysets.py
"""
PQM QuerySet and Manager — scoped data access layer.

PQMBaseQuerySet implements a 5-step scope resolution that enforces
tenant isolation and RBAC-based data visibility for all PQM queries.
"""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from django.db import models

if TYPE_CHECKING:
    pass


class PQMBaseQuerySet(models.QuerySet):
    """
    Base QuerySet for all PQM models with tenant-scoped data access.

    Use .scoped_for(user) to apply the 5-step scope resolution.
    Use .alive() to exclude soft-deleted records.
    """

    def alive(self) -> "PQMBaseQuerySet":
        """Exclude soft-deleted records."""
        return self.filter(is_deleted=False)

    def scoped_for(self, user, include_deleted: bool = False) -> "PQMBaseQuerySet":
        """
        Apply 5-step scope resolution for the given user.

        Step 1: Platform admins (is_staff/is_superuser) — return empty queryset.
                Platform admins must explicitly access data via Django admin or
                super-admin tools, NOT via tenant APIs.
        Step 2: If user has pqm.view_all_bu → filter by organization_id only.
        Step 3: If user has pqm.view_nc AND is External Client Auditor →
                filter by project_ids from their role assignment.
        Step 4: Default → filter by active business_unit_id.
        Step 5: Always exclude soft-deleted (unless include_deleted=True).

        Args:
            user: The request.user (authenticated Django user object).
            include_deleted: If True, include soft-deleted records.

        Returns:
            Scoped queryset.
        """
        qs = self

        # Step 1: Platform admins get no default data access via PQM APIs
        if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
            qs = qs.none()
            if not include_deleted:
                qs = qs.filter(is_deleted=False)
            return qs

        # Resolve SecurityContext if available
        security_ctx = getattr(user, "security_context", None)

        def _has_perm(codename: str) -> bool:
            """Check permission via SecurityContext or fallback to has_perm."""
            if security_ctx is not None:
                return security_ctx.has_permission(codename)
            return getattr(user, "has_perm", lambda x: False)(codename)

        # Resolve organization_id from user
        organization_id = (
            getattr(security_ctx, "organization_id", None)
            if security_ctx else None
        ) or getattr(user, "organization_id", None)

        # Resolve business_unit_id from user / security context
        business_unit_id = (
            getattr(security_ctx, "business_unit_id", None)
            if security_ctx else None
        ) or getattr(user, "active_business_unit_id", None) or getattr(user, "business_unit_id", None)

        # Step 2: View all BUs in the organization
        if _has_perm("pqm.view_all_bu") and organization_id:
            qs = qs.filter(organization_id=organization_id)
            if not include_deleted:
                qs = qs.filter(is_deleted=False)
            return qs

        # Step 3: External Client Auditor — restricted to their assigned projects
        # Detected by role name check via security context permissions or role name
        role_name = ""
        if security_ctx is not None:
            role_name = getattr(security_ctx, "role_name", "") or ""

        is_external_auditor = (
            "External Client Auditor" in role_name
            or _has_perm("pqm.view_nc")
        )
        if is_external_auditor and not _has_perm("pqm.view_all_bu"):
            # External auditors: scope to project_ids from their role assignment
            assigned_project_ids = getattr(security_ctx, "project_ids", None) if security_ctx else None
            if assigned_project_ids:
                qs = qs.filter(project_id__in=assigned_project_ids)
                if not include_deleted:
                    qs = qs.filter(is_deleted=False)
                return qs
            # No specific projects assigned — fall through to BU scope

        # Step 4: Default — filter by business_unit_id
        if business_unit_id:
            qs = qs.filter(business_unit_id=business_unit_id)
        else:
            # No BU context resolved — return empty for safety
            qs = qs.none()

        # Step 5: Exclude soft-deleted
        if not include_deleted:
            qs = qs.filter(is_deleted=False)

        return qs


class PQMBaseManager(models.Manager):
    """
    Default manager for PQM models using PQMBaseQuerySet.
    Excludes soft-deleted records by default (alive() applied in get_queryset).
    """

    def get_queryset(self) -> PQMBaseQuerySet:
        return PQMBaseQuerySet(self.model, using=self._db).filter(is_deleted=False)

    def including_deleted(self) -> PQMBaseQuerySet:
        """Return all records including soft-deleted."""
        return PQMBaseQuerySet(self.model, using=self._db)

    def scoped_for(self, user, include_deleted: bool = False) -> PQMBaseQuerySet:
        """Convenience proxy to get_queryset().scoped_for(user)."""
        return PQMBaseQuerySet(self.model, using=self._db).scoped_for(
            user, include_deleted=include_deleted
        )
