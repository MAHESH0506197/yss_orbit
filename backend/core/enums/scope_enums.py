# yss_orbit\backend\core\enums\scope_enums.py
"""
RBAC and scope enums.
"""
from .base_enums import BaseTextChoices

class AccessScope(BaseTextChoices):
    READ = "READ", "Read Access"
    WRITE = "WRITE", "Write Access"
    ADMIN = "ADMIN", "Admin Access"

class ResourceType(BaseTextChoices):
    USER = "USER", "User"
    ORGANIZATION = "ORGANIZATION", "Organization"
    BILLING = "BILLING", "Billing"
    INVENTORY = "INVENTORY", "Inventory"
