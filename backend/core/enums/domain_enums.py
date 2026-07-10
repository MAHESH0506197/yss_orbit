# yss_orbit\backend\core\enums\domain_enums.py
"""
Domain and Tenancy enums.
"""
from .base_enums import BaseTextChoices

class TenantStatus(BaseTextChoices):
    ACTIVE = "ACTIVE", "Active"
    SUSPENDED = "SUSPENDED", "Suspended"
    ARCHIVED = "ARCHIVED", "Archived"
    PROVISIONING = "PROVISIONING", "Provisioning"

class SubscriptionPlan(BaseTextChoices):
    FREE = "FREE", "Free"
    BASIC = "BASIC", "Basic"
    PRO = "PRO", "Pro"
    ENTERPRISE = "ENTERPRISE", "Enterprise"
