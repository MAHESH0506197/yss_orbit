# yss_orbit/backend/apps/rbac/services/rbac_service.py
import logging
import uuid
from typing import Set, FrozenSet

from django.core.cache import cache

from apps.iam.models import UserPermissionOverride
from apps.iam.repositories.user_role_repository import UserRoleRepository

logger = logging.getLogger(__name__)


class RBACService:
    """
    Enterprise-grade Service for RBAC read operations.
    Used for permission evaluation.
    """

    @classmethod
    def get_cache_key(cls, user_id: uuid.UUID | str, business_unit_id: uuid.UUID | str) -> str:
        return f"permissions:{user_id}:{business_unit_id}"

    @classmethod
    def get_user_permissions_as_frozenset(
        cls, user_id: uuid.UUID | str, business_unit_id: uuid.UUID | str
    ) -> FrozenSet[str]:
        """
        Retrieves all active permission codes for a user in a specific business unit.
        Applies caching and user overrides.

        This is the AUTHORITATIVE, BU-scoped permission set used to build
        request.security_context.permissions (HasRBACPermission's primary
        source — see core/permissions/rbac_permission.py).
        """
        cache_key = cls.get_cache_key(user_id, business_unit_id)
        cached_perms = cache.get(cache_key)
        if cached_perms is not None:
            return frozenset(cached_perms)

        repo = UserRoleRepository()
        user_roles = repo.get_active_for_user_in_bu(
            user_id=user_id, business_unit_id=business_unit_id
        )

        perms: Set[str] = set()
        # 1. Load role-based permissions
        for ur in user_roles:
            perms.update(ur.role.get_permission_codes())

        # 2. User overrides
        overrides = UserPermissionOverride.objects.filter(
            user_id=user_id, business_unit_id=business_unit_id
        )
        granted = {o.permission_code for o in overrides if o.is_grant}
        revoked = {o.permission_code for o in overrides if not o.is_grant}

        # 3. Combine
        final_perms = frozenset((perms | granted) - revoked)

        # 4. Cache (set for 1 hour, signals will invalidate it on changes)
        cache.set(cache_key, list(final_perms), timeout=3600)

        return final_perms

    @classmethod
    def get_user_permissions_all_bus(cls, user_id: uuid.UUID | str) -> FrozenSet[str]:
        """
        FIX-BUG14: Union of permission codes across ALL of the user's active
        role assignments, across every business unit they belong to.

        Used by TokenService._load_platform_permissions() (core/auth/jwt_handler.py)
        to populate the "permissions" JWT claim at login/token-refresh time —
        before any business_unit_id is known/selected.

        NOT cached under the same key as get_user_permissions_as_frozenset()
        (uses a separate "permissions:all:{user_id}" key) since it spans BUs.
        invalidate_user_permissions() below clears both keys for a given user.
        """
        cache_key = f"permissions:all:{user_id}"
        cached_perms = cache.get(cache_key)
        if cached_perms is not None:
            return frozenset(cached_perms)

        repo = UserRoleRepository()
        user_roles = repo.get_active_for_user(user_id=user_id)

        perms: Set[str] = set()
        for ur in user_roles:
            perms.update(ur.role.get_permission_codes())

        # Apply overrides across all BUs the user has overrides in.
        overrides = UserPermissionOverride.objects.filter(user_id=user_id)
        granted = {o.permission_code for o in overrides if o.is_grant}
        revoked = {o.permission_code for o in overrides if not o.is_grant}

        final_perms = frozenset((perms | granted) - revoked)

        cache.set(cache_key, list(final_perms), timeout=3600)

        return final_perms

    @classmethod
    def invalidate_user_permissions(cls, user_id: uuid.UUID | str, business_unit_id: uuid.UUID | str) -> None:
        """
        Invalidates the permission cache for a specific user in a specific business unit,
        and the cross-BU superset cache (FIX-BUG14) for that user.
        """
        cache.delete(cls.get_cache_key(user_id, business_unit_id))
        cache.delete(f"permissions:all:{user_id}")
