# yss_orbit\backend\core\logging\structured_logger.py
"""
Structured logging module.
"""
import logging
from pythonjsonlogger import jsonlogger

class OrbitJsonFormatter(jsonlogger.JsonFormatter):
    """
    Custom JSON formatter for Orbit that enforces a strict schema.
    """
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        if not log_record.get("timestamp"):
            log_record["timestamp"] = self.formatTime(record, self.datefmt)
        if log_record.get("level"):
            log_record["level"] = log_record["level"].upper()
        else:
            log_record["level"] = record.levelname
        log_record["logger"] = record.name
