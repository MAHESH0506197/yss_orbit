# yss_orbit\backend\apps\platform\governance\platform_settings.py
class PlatformSettings:
    """
    Global hardcoded or cached platform configurations.
    Used by the super-admins to dictate platform-wide behavior (like turning off all outbound emails during an incident).
    """
    PLATFORM_NAME = "YSS Orbit"
    PLATFORM_VERSION = "2.0.0-beta"
    
    # Kill switches
    EMAILS_ENABLED = True
    BACKGROUND_TASKS_ENABLED = True
    
    @classmethod
    def check_feature(cls, feature_name: str) -> bool:
        return getattr(cls, feature_name.upper() + "_ENABLED", False)
