# yss_orbit\backend\core\enums\branding_enums.py
"""
Branding enums.
"""
from .base_enums import BaseTextChoices

class ThemeMode(BaseTextChoices):
    LIGHT = "LIGHT", "Light"
    DARK = "DARK", "Dark"
    SYSTEM = "SYSTEM", "System"

class FontPrimary(BaseTextChoices):
    INTER = "INTER", "Inter"
    ROBOTO = "ROBOTO", "Roboto"
    OUTFIT = "OUTFIT", "Outfit"
