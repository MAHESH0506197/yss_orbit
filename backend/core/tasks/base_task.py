# yss_orbit\backend\core\tasks\base_task.py
import logging
import traceback
from typing import Any
from celery import Task
from celery.exceptions import Ignore

from .retry_policy import RetryPolicy, get_default_retry_policy
from .dlq_handler import DLQHandler

logger = logging.getLogger(__name__)

class BaseTask(Task):
    """
    Enterprise-grade base Celery task providing standardized retry policies,
    Dead Letter Queue (DLQ) integration, and enhanced logging.
    """
    abstract = True
    
    # Defaults; can be overridden in subclasses
    retry_policy: RetryPolicy = get_default_retry_policy()
    dlq_handler: DLQHandler = DLQHandler()
    
    def on_failure(self, exc: Exception, task_id: str, args: tuple, kwargs: dict, einfo: Any) -> None:
        """Hook called when the task fails."""
        logger.error(f"Task {self.name}[{task_id}] failed: {exc}")
        super().on_failure(exc, task_id, args, kwargs, einfo)
        
    def on_retry(self, exc: Exception, task_id: str, args: tuple, kwargs: dict, einfo: Any) -> None:
        """Hook called when the task is retried."""
        logger.warning(f"Task {self.name}[{task_id}] retrying due to: {exc}")
        super().on_retry(exc, task_id, args, kwargs, einfo)
        
    def run(self, *args: Any, **kwargs: Any) -> Any:
        return None
        
    def __call__(self, *args: Any, **kwargs: Any) -> Any:
        try:
            return super().__call__(*args, **kwargs)
        except Exception as exc:
            # If it's an exception we shouldn't retry (e.g., validation error), we could handle it here
            
            current_attempt = self.request.retries
            max_retries = self.retry_policy.max_retries
            
            if current_attempt < max_retries:
                delay = self.retry_policy.get_next_delay(current_attempt)
                logger.info(f"Retrying task {self.name} in {delay} seconds (Attempt {current_attempt + 1}/{max_retries})")
                raise self.retry(exc=exc, countdown=delay)
            else:
                # Exhausted retries, move to DLQ
                tb_str = traceback.format_exc()
                self.dlq_handler.handle_failed_task(
                    task_name=self.name,
                    task_id=self.request.id,
                    args=args,
                    kwargs=kwargs,
                    exception=exc,
                    traceback_str=tb_str
                )
                raise exc
