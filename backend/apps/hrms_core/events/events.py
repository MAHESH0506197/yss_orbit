# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\events\events.py
import logging

logger = logging.getLogger(__name__)

class Events:
    @staticmethod
    def on_created(instance):
        logger.info(f"Record created: {instance}")

    @staticmethod
    def on_updated(instance):
        logger.info(f"Record updated: {instance}")
