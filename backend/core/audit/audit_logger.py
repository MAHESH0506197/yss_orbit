# yss_orbit\backend\core\audit\audit_logger.py
"""
Logger for audit events.
"""
import logging
from .audit_formatter import format_audit_payload

logger = logging.getLogger("audit")

def log_audit_event(
    action: str, 
    resource: str, 
    resource_id: str, 
    changes: dict = None, 
    status: str = "SUCCESS"
) -> None:
    """
    Write an audit event to the dedicated audit logger.
    """
    payload = format_audit_payload(action, resource, resource_id, changes, status)
    logger.info("AUDIT_EVENT", extra={"audit": payload})
