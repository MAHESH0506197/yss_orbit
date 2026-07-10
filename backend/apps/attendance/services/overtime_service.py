# yss_orbit\backend\apps\attendance\services\overtime_service.py
import logging

logger = logging.getLogger(__name__)

class OvertimeService:
    """
    Service class handling business logic for OvertimeService.
    """
    @classmethod
    def process(cls, *args, **kwargs):
        logger.info(f"Processing in {cls.__name__}")
        pass
