# yss_orbit\backend\apps\business_unit\tasks\business_unit_tasks.py
import logging
from celery import shared_task

logger = logging.getLogger(__name__)

@shared_task
def sync_background_task():
    logger.info('Running background task')
