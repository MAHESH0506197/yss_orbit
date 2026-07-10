# yss_orbit\backend\apps\user_business_unit\services\membership_service.py
"""
MembershipService — thin facade kept for backward compatibility.
Delegates to UserBusinessUnitService.
"""
from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, List, Optional

from apps.organization.models.user_business_unit_model import UserBusinessUnitModel
from apps.organization.selectors.user_business_unit_selectors import (
    get_memberships_for_user,
    get_members_in_bu,
)

logger = logging.getLogger(__name__)


class MembershipService:
    """
    Query helpers for membership lookups.
    For mutation operations, use UserBusinessUnitService.
    """

    @staticmethod
    def get_active_memberships_for_user(
        user_id: uuid.UUID,
    ) -> List[UserBusinessUnitModel]:
        """Returns all active memberships for a given user."""
        return get_memberships_for_user(user_id)

    @staticmethod
    def get_active_members_in_bu(
        business_unit_id: uuid.UUID,
    ) -> List[UserBusinessUnitModel]:
        """Returns all active members of a given business unit."""
        return get_members_in_bu(business_unit_id)

    @staticmethod
    def is_user_member_of_bu(
        user_id: uuid.UUID,
        business_unit_id: uuid.UUID,
    ) -> bool:
        """Checks if a user has an active membership in the given BU."""
        return UserBusinessUnitModel.objects.filter(
            user_id=user_id,
            business_unit_id=business_unit_id,
            is_active_membership=True,
        ).exists()
