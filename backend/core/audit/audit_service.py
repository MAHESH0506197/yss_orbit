# yss_orbit\backend\core\audit\audit_service.py
"""
Service to persist audit logs asynchronously.
"""
from .audit_logger import log_audit_event
from .audit_events import AuditEvents

class AuditService:
    """
    High-level service for triggering audit events.
    In an enterprise setting, this would also push events to a queue (e.g. Celery/Kafka)
    for persistence in a specialized Audit log database.
    """
    
    @staticmethod
    def record(
        action: str, 
        resource: str, 
        resource_id: str, 
        changes: dict = None, 
        status: str = "SUCCESS"
    ) -> None:
        """
        Record an audit event.
        """
        # Synchronous logging (can be picked up by Fluentd/Logstash)
        log_audit_event(action, resource, resource_id, changes, status)
        
        # Async dispatch to DB would happen here if required
        # e.g., from apps.platform.core_tasks import persist_audit_log
        # persist_audit_log.delay(payload)
