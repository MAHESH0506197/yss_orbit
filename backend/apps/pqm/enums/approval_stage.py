# yss_orbit\backend\apps\pqm\enums\approval_stage.py
from django.db import models


class ApprovalStage(models.TextChoices):
    REVIEW       = "review",       "Review"
    VERIFICATION = "verification", "Verification"
