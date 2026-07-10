# yss_orbit\backend\apps\attendance\services\biometric_sync_service.py
import logging

logger = logging.getLogger(__name__)

class BiometricSyncService:
    """
    Service class handling business logic for BiometricSyncService.
    """
    @classmethod
    def process(cls, *args, **kwargs):
        logger.info(f"Processing in {cls.__name__}")
        pass
