# yss_orbit\backend\core\logging\logger.py
"""
Core Logger wrapper.
"""
import logging
from .log_enricher import ContextFilter

def get_logger(name: str) -> logging.Logger:
    """
    Get a pre-configured logger with the context filter attached.
    """
    logger = logging.getLogger(name)
    # Ensure the context filter is applied if not already there
    if not any(isinstance(f, ContextFilter) for f in logger.filters):
        logger.addFilter(ContextFilter())
    return logger
