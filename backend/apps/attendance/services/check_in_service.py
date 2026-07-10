# yss_orbit\backend\apps\attendance\services\check_in_service.py
import logging

logger = logging.getLogger(__name__)

class CheckInService:
    """
    Service class handling business logic for CheckInService.
    """
    @classmethod
    def process(cls, *args, **kwargs):
        logger.info(f"Processing in {cls.__name__}")
        pass
