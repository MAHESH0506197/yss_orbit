# yss_orbit\backend\apps\appraisal\events\event_handlers.py
import logging

logger = logging.getLogger(__name__)

class EventHandlers:
    @staticmethod
    def on_created(instance):
        logger.info(f"Record created: {instance}")

    @staticmethod
    def on_updated(instance):
        logger.info(f"Record updated: {instance}")
