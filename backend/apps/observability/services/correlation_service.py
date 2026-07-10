# yss_orbit\backend\apps\observability\services\correlation_service.py
import uuid
import logging
from threading import local

logger = logging.getLogger(__name__)
_thread_locals = local()

class CorrelationService:
    """
    Generates and propagates trace IDs/correlation IDs across thread boundaries
    to tie logs to specific web requests.
    """
    @staticmethod
    def generate_trace_id() -> str:
        return uuid.uuid4().hex

    @staticmethod
    def set_trace_id(trace_id: str):
        _thread_locals.trace_id = trace_id

    @staticmethod
    def get_trace_id() -> str:
        return getattr(_thread_locals, 'trace_id', None)
