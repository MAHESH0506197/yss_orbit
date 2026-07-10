# yss_orbit\backend\apps\attendance\services\shift_service.py
import logging

logger = logging.getLogger(__name__)

class ShiftService:
    """
    Service class handling business logic for ShiftService.
    """
    @classmethod
    def process(cls, *args, **kwargs):
        logger.info(f"Processing in {cls.__name__}")
        pass
