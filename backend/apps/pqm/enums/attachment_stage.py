# yss_orbit\backend\apps\pqm\enums\attachment_stage.py
from django.db import models


class AttachmentStage(models.TextChoices):
    BEFORE   = "before",   "Before (Evidence)"
    AFTER    = "after",    "After (Rectification)"
    DOCUMENT = "document", "Supporting Document"
    DRAWING  = "drawing",  "Drawing Reference"
    REPORT   = "report",   "Report"
