# yss_orbit\backend\apps\error_log\events\events.py
import logging

logger = logging.getLogger(__name__)

class BaseEvent:
    def __init__(self, **kwargs):
        self.data = kwargs
