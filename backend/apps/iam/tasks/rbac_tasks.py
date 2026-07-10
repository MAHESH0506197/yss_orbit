# yss_orbit\backend\apps\rbac\tasks\rbac_tasks.py
import logging
from celery import shared_task

logger = logging.getLogger(__name__)

@shared_task
def sync_background_task():
    logger.info('Running background task')
