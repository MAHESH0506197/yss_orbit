# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\services\hrms_core_service.py
import logging

logger = logging.getLogger(__name__)

class HrmsCoreService:
    """
    Service class handling business logic for HrmsCoreService.
    """
    @classmethod
    def process(cls, *args, **kwargs):
        logger.info(f"Processing in {cls.__name__}")
        pass
