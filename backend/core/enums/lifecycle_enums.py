# yss_orbit\backend\core\enums\lifecycle_enums.py
"""
Lifecycle and state enums.
"""
from .base_enums import BaseTextChoices

class LifecycleState(BaseTextChoices):
    DRAFT = "DRAFT", "Draft"
    PENDING = "PENDING", "Pending Approval"
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    DELETED = "DELETED", "Deleted"

class ProcessingStatus(BaseTextChoices):
    QUEUED = "QUEUED", "Queued"
    PROCESSING = "PROCESSING", "Processing"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"
