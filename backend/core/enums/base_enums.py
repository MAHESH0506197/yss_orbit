# yss_orbit\backend\core\enums\base_enums.py
"""
Base enum classes.
"""
from django.db import models

class BaseTextChoices(models.TextChoices):
    """Base text choices with a helper to get all values."""
    @classmethod
    def values_list(cls) -> list[str]:
        return [choice.value for choice in cls]

class BaseIntegerChoices(models.IntegerChoices):
    """Base integer choices with a helper to get all values."""
    @classmethod
    def values_list(cls) -> list[int]:
        return [choice.value for choice in cls]
