# apps/business_unit/selectors/business_unit_selectors.py
# FIX-BUG02: Removed ALL references to 'industry' field (deleted in migration 0013).
# - get_by_industry() replaced by get_by_business_domain()
# - list_for_dropdown() .only() updated: removed "industry"
from __future__ import annotations
import uuid
from django.db.models import Q, QuerySet
from apps.organization.models import BusinessUnit


class BusinessUnitSelectors:

    @staticmethod
    def get_by_id(bu_id: uuid.UUID, org_id: uuid.UUID | None = None) -> BusinessUnit:
        # FIX: select_related("business_domain") removed — business_domain is a Python property,
        # not a real FK field on BusinessUnit. Use select_related("organization__business_domain") instead.
        qs = (
            BusinessUnit.objects
            .select_related("organization", "organization__business_domain")
            .filter(id=bu_id, is_deleted=False)
        )
        if org_id is not None:
            qs = qs.filter(organization_id=org_id)
        return qs.get()

    @staticmethod
    def get_active(org_id: uuid.UUID) -> QuerySet:
        return (
            BusinessUnit.objects
            .filter(organization_id=org_id, is_active=True, is_deleted=False)
            .select_related("organization", "organization__business_domain")
            .order_by("name")
        )

    @staticmethod
    def get_all_non_deleted(org_id: uuid.UUID) -> QuerySet:
        return (
            BusinessUnit.objects
            .filter(organization_id=org_id, is_deleted=False)
            .select_related("organization", "organization__business_domain")
            .order_by("name")
        )

    @staticmethod
    def get_main_branch(org_id: uuid.UUID) -> "BusinessUnit | None":
        return (
            BusinessUnit.objects
            .filter(organization_id=org_id, is_main_branch=True, is_deleted=False)
            .select_related("organization")
            .first()
        )

    @staticmethod
    def search(org_id: uuid.UUID, term: str) -> QuerySet:
        return (
            BusinessUnit.objects
            .filter(
                Q(name__icontains=term)
                | Q(code__icontains=term)
                | Q(city__icontains=term)
                | Q(email__icontains=term),
                organization_id=org_id,
                is_deleted=False,
            )
            .select_related("organization", "organization__business_domain")
            .order_by("name")
        )

    @staticmethod
    def get_by_code(org_id: uuid.UUID, code: str) -> "BusinessUnit | None":
        return (
            BusinessUnit.objects
            .filter(organization_id=org_id, code=code, is_deleted=False)
            .first()
        )

    @staticmethod
    def get_by_business_domain(org_id: uuid.UUID, domain_id: uuid.UUID) -> QuerySet:
        """
        FIX-BUG02: Replaces get_by_industry() — filters by business_domain.
        FIX-FIELDerror: business_domain_id is a Python property on BusinessUnit (not a real DB column).
        Must filter via organization__business_domain_id (the real FK chain).
        """
        return (
            BusinessUnit.objects
            .filter(
                organization_id=org_id,
                organization__business_domain_id=domain_id,
                is_deleted=False,
            )
            .select_related("organization", "organization__business_domain")
            .order_by("name")
        )

    @staticmethod
    def list_for_dropdown(org_id: uuid.UUID) -> QuerySet:
        """
        Lightweight queryset for select/dropdown rendering.
        FIX-BUG02: Removed 'industry' from .only() — field no longer exists on model.
        """
        return (
            BusinessUnit.objects
            .filter(organization_id=org_id, is_active=True, is_deleted=False)
            .only("id", "name", "code")   # FIX: 'industry' removed
            .order_by("name")
        )
