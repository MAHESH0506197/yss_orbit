# yss_orbit\backend\core\config\env.py
"""
Environment variable utilities.
"""
import os
from typing import Any, Callable

def get_env(key: str, default: Any = None, cast: Callable[[str], Any] = str) -> Any:
    """Retrieve an environment variable with optional casting and default."""
    value = os.environ.get(key)
    if value is None:
        return default
    try:
        if cast == bool:
            return str(value).lower() in ("true", "1", "yes", "t", "y")
        return cast(value)
    except (ValueError, TypeError):
        return default
