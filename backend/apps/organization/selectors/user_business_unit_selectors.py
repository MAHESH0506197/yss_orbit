# yss_orbit\backend\apps\user_business_unit\selectors\user_business_unit_selectors.py
"""
Read-only query selectors for UBU memberships.
Use these in views and services instead of direct ORM queries.
"""
from __future__ import annotations

import uuid
from typing import List, Optional

from django.utils import timezone
from django.db.models import Q

from apps.organization.models.user_business_unit_model import UserBusinessUnitModel


def get_active_memberships_query():
    """
    Base query applying B27 enterprise rules:
    - Membership is active and not deleted
    - Effective dates are valid
    - Suspension Precedence: Parent BU and Organization are active.
    """
    now = timezone.now()
    return UserBusinessUnitModel.objects.filter(
        is_active_membership=True,
        is_deleted=False,
        business_unit__is_active=True,
        business_unit__is_deleted=False,
        business_unit__organization__is_active=True,
        business_unit__organization__is_deleted=False,
    ).filter(
        Q(effective_from__isnull=True) | Q(effective_from__lte=now)
    ).filter(
        Q(effective_to__isnull=True) | Q(effective_to__gte=now)
    )

def get_memberships_for_user(user_id: uuid.UUID) -> List[UserBusinessUnitModel]:
    """All active memberships for a given user, applying B27 rules."""
    return list(
        get_active_memberships_query()
        .select_related("business_unit", "role")
        .filter(user_id=user_id)
    )


def get_members_in_bu(business_unit_id: uuid.UUID) -> List[UserBusinessUnitModel]:
    """All active members of a given business unit, applying B27 rules."""
    return list(
        get_active_memberships_query()
        .select_related("user", "role")
        .filter(business_unit_id=business_unit_id)
    )


def get_membership(user_id: uuid.UUID, business_unit_id: uuid.UUID) -> Optional[UserBusinessUnitModel]:
    """Get a specific user-BU membership (active or not)."""
    return (
        UserBusinessUnitModel.objects
        .select_related("user", "business_unit", "role")
        .filter(user_id=user_id, business_unit_id=business_unit_id)
        .first()
    )


def is_user_member(user_id: uuid.UUID, business_unit_id: uuid.UUID) -> bool:
    """True if user has at least one active membership in the given BU under B27 rules."""
    return get_active_memberships_query().filter(
        user_id=user_id,
        business_unit_id=business_unit_id,
    ).exists()
