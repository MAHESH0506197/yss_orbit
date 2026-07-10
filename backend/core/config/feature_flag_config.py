# yss_orbit\backend\core\config\feature_flag_config.py
"""
Feature flag configuration constants and helpers.
"""

class FeatureFlags:
    """Global feature flags for Orbit."""
    ENABLE_ADVANCED_AUDIT = "enable_advanced_audit"
    ENABLE_NEW_DASHBOARD = "enable_new_dashboard"
    ENABLE_BETA_API = "enable_beta_api"
    MAINTENANCE_MODE = "maintenance_mode"

def is_feature_enabled(flag_name: str, tenant_id: str = None, user_id: str = None) -> bool:
    """
    Check if a feature is enabled.
    This hooks into the Apps Feature Flag engine (implemented later).
    For now, defaults to False unless overriden.
    """
    from django.conf import settings
    # For now, rely on a mock or setting if the full FF app isn't ready
    flags = getattr(settings, "FEATURE_FLAGS", {})
    return flags.get(flag_name, False)
