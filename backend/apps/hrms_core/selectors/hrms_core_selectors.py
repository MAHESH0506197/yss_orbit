# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\selectors\hrms_core_selectors.py
import logging

logger = logging.getLogger(__name__)

class HrmsCoreSelectors:
    """
    Service class handling business logic for HrmsCoreSelectors.
    """
    @classmethod
    def process(cls, *args, **kwargs):
        logger.info(f"Processing in {cls.__name__}")
        pass
