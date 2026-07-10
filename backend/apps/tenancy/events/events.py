# yss_orbit\backend\apps\subscription\events\events.py
from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class SubscriptionCreatedEvent:
    id: str
    tenant_id: str
    timestamp: str
    data: Dict[str, Any]

@dataclass
class SubscriptionUpdatedEvent:
    id: str
    tenant_id: str
    timestamp: str
    data: Dict[str, Any]
