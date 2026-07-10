# yss_orbit\backend\apps\observability\tasks\observability_tasks.py
from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task(name="observability.purge_old_traces")
def purge_old_traces():
    """
    Celery task to automatically delete old traces/metrics to save database space.
    """
    logger.info("Purging old observability data...")
    # Mock logic
    logger.info("Purge complete.")
