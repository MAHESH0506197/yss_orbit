# yss_orbit\backend\apps\pqm\enums\priority.py
from django.db import models


class Priority(models.TextChoices):
    """
    NC priority levels per Spec Section 6.1.
    SLA days: Critical=2, High=5, Medium=10, Low=20.
    Safety-Critical NCs override all priority SLAs to 24 hours.
    """
    CRITICAL = "Critical", "Critical"
    HIGH     = "High",     "High"
    MEDIUM   = "Medium",   "Medium"
    LOW      = "Low",      "Low"

    @classmethod
    def default_sla_days(cls) -> dict:
        """Default SLA days by priority. Configurable per tenant via PQMEscalationConfig."""
        return {
            cls.CRITICAL: 2,
            cls.HIGH:     5,
            cls.MEDIUM:   10,
            cls.LOW:      20,
        }
