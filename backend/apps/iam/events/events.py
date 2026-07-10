# yss_orbit\backend\apps\rbac\events\events.py
from dataclasses import dataclass
from typing import Any, Dict

@dataclass
class BaseEvent:
    event_id: str
    metadata: Dict[str, Any] = None
