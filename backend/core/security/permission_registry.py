# yss_orbit\backend\core\security\permission_registry.py
"""
YSS Orbit - Permission Registry
Central registry for defining and resolving permissions across the platform.
"""
from __future__ import annotations

import logging
from typing import Dict, List, Set

logger = logging.getLogger(__name__)


class PermissionRegistry:
    """
    Central registry for platform permissions.
    Prevents typos and centralizes permission definitions.
    """
    
    _registry: Dict[str, dict] = {}

    @classmethod
    def register(cls, code: str, description: str, module: str):
        """
        Register a new permission.
        """
        if code in cls._registry:
            logger.warning(f"Permission {code} is already registered.")
            return

        cls._registry[code] = {
            "code": code,
            "description": description,
            "module": module,
        }

    @classmethod
    def get_all(cls) -> List[dict]:
        """
        Get a list of all registered permissions.
        """
        return list(cls._registry.values())

    @classmethod
    def get_by_module(cls, module: str) -> List[dict]:
        """
        Get all permissions for a specific module.
        """
        return [p for p in cls._registry.values() if p["module"] == module]

    @classmethod
    def is_valid(cls, code: str) -> bool:
        """
        Check if a permission code is valid.
        """
        return code in cls._registry


# Pre-register some base platform permissions
PermissionRegistry.register("users:read", "View users", "Core")
PermissionRegistry.register("users:write", "Create and edit users", "Core")
PermissionRegistry.register("users:delete", "Delete users", "Core")
PermissionRegistry.register("roles:read", "View roles", "RBAC")
PermissionRegistry.register("roles:write", "Manage roles and permissions", "RBAC")
PermissionRegistry.register("billing:read", "View billing information", "Billing")
PermissionRegistry.register("billing:write", "Manage billing and subscriptions", "Billing")
