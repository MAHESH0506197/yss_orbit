# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\repositories\hrms_core_repository.py
import logging

logger = logging.getLogger(__name__)

class HrmsCoreRepository:
    """
    Service class handling business logic for HrmsCoreRepository.
    """
    @classmethod
    def process(cls, *args, **kwargs):
        logger.info(f"Processing in {cls.__name__}")
        pass
