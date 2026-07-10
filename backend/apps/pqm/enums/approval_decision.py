# yss_orbit\backend\apps\pqm\enums\approval_decision.py
from django.db import models


class ApprovalDecision(models.TextChoices):
    PENDING  = "Pending",  "Pending"
    APPROVED = "Approved", "Approved"
    REJECTED = "Rejected", "Rejected"
    REWORK   = "Rework",   "Rework"
