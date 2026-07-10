# yss_orbit\backend\apps\pqm\enums\nc_series.py
from django.db import models


class NCSeries(models.TextChoices):
    """
    NC numbering series per Spec Section 6.1.
    LIVE: live NCs (sequential per org per year).
    LEGACY: records imported from Excel — never collides with LIVE.
    """
    LIVE   = "LIVE",   "Live"
    LEGACY = "LEGACY", "Legacy (Migrated)"
