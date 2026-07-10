# yss_orbit\backend\apps\error_log\events\event_handlers.py
import logging

logger = logging.getLogger(__name__)

def handle_event(event):
    logger.info(f"Handling event: {event}")
