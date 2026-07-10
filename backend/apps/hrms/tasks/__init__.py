# yss_orbit/backend/apps/hrms/tasks/__init__.py
from .analytics_tasks import generate_analytics_snapshot_task
from .notification_tasks import (
    notify_document_expiry_task,
    notify_it_declaration_deadline_task,
)

__all__ = [
    "generate_analytics_snapshot_task",
    "notify_document_expiry_task",
    "notify_it_declaration_deadline_task",
]
