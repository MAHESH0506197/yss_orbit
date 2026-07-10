# yss_orbit\backend\core\utils\string_utils.py
"""
String manipulation utilities.
"""
from __future__ import annotations

import re
import uuid

def camel_to_snake(name: str) -> str:
    """Convert CamelCase to snake_case."""
    name = re.sub("(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", name).lower()

def snake_to_camel(name: str) -> str:
    """Convert snake_case to CamelCase."""
    return "".join(word.title() for word in name.split("_"))

def is_valid_uuid(val: str) -> bool:
    """Check if a string is a valid UUID."""
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False
