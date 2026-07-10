# yss_orbit\backend\core\logging\audit_formatter.py
"""
Audit log formatter.
"""
import logging

class AuditFormatter(logging.Formatter):
    """
    Formatter specifically for audit logs to ensure compliance.
    """
    def format(self, record):
        # Enforce strict audit fields
        audit_data = {
            "timestamp": self.formatTime(record, self.datefmt),
            "actor": getattr(record, "actor", "SYSTEM"),
            "action": getattr(record, "action", "UNKNOWN"),
            "resource": getattr(record, "resource", "UNKNOWN"),
            "resource_id": getattr(record, "resource_id", None),
            "status": getattr(record, "status", "SUCCESS"),
            "ip_address": getattr(record, "ip_address", None),
            "user_agent": getattr(record, "user_agent", None),
        }
        return str(audit_data)
