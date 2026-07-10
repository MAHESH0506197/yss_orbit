# yss_orbit\backend\apps\attendance\events\events.py
import logging

logger = logging.getLogger(__name__)

class Events:
    @staticmethod
    def on_created(instance):
        logger.info(f"Record created: {instance}")

    @staticmethod
    def on_updated(instance):
        logger.info(f"Record updated: {instance}")
