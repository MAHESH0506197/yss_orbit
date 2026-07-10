# yss_orbit\backend\core\logging\error_logger.py
"""
Error logging utilities.
"""
import sys
import traceback
from .logger import get_logger

logger = get_logger(__name__)

def log_error(exception: Exception, context: dict = None):
    """
    Logs an error with full stack trace and context.
    """
    exc_type, exc_value, exc_traceback = sys.exc_info()
    tb_str = "".join(traceback.format_exception(exc_type, exc_value, exc_traceback))
    
    extra = {"context": context or {}, "traceback": tb_str}
    logger.error(f"Exception occurred: {str(exception)}", extra=extra)
