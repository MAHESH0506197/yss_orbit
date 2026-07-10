# yss_orbit\backend\apps\pqm\enums\backcharge_status.py
from django.db import models


class BackchargeStatus(models.TextChoices):
    NOT_APPLICABLE      = "Not Applicable",      "Not Applicable"
    PROPOSED            = "Proposed",             "Proposed"
    CONTRACTOR_DISPUTED = "Contractor Disputed",  "Contractor Disputed"
    AGREED              = "Agreed",               "Agreed"
    DEDUCTED            = "Deducted",             "Deducted"
