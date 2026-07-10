# yss_orbit\backend\apps\jobs\tasks.py
"""
YSS Orbit - Background Job Registry and Task Base
Provides a custom Celery Task class that automatically updates JobStatus models,
and a registry for discoverable jobs.
"""
from typing import Any, Callable, Dict, Type

from celery import Task
from celery.utils.log import get_task_logger

from apps.platform.models import BackgroundJob, JobStatus

logger = get_task_logger(__name__)

# Registry for discoverable job types
_JOB_REGISTRY: Dict[str, dict] = {}

def register_job(name: str, description: str = ""):
    """Decorator to register a celery task in the background job registry."""
    def decorator(task_func: Callable) -> Callable:
        _JOB_REGISTRY[name] = {
            "name": name,
            "description": description,
            "task_path": f"{task_func.__module__}.{task_func.__name__}",
        }
        return task_func
    return decorator

def get_registered_jobs() -> Dict[str, dict]:
    """Return all registered jobs."""
    return _JOB_REGISTRY

class OrbitTrackedTask(Task):
    """
    A Celery Task base class that automatically syncs state with a BackgroundJob model.
    It expects the first argument to be `job_id` (a UUID).
    """
    abstract = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        super().on_failure(exc, task_id, args, kwargs, einfo)
        job_id = kwargs.get("job_id") or (args[0] if args else None)
        if job_id:
            try:
                job = BackgroundJob.objects.get(id=job_id)
                job.mark_failed(error=str(exc))
                logger.error(f"Job {job_id} failed: {exc}")
            except BackgroundJob.DoesNotExist:
                logger.error(f"Job {job_id} failed but model not found.")

    def on_success(self, retval, task_id, args, kwargs):
        super().on_success(retval, task_id, args, kwargs)
        job_id = kwargs.get("job_id") or (args[0] if args else None)
        if job_id:
            try:
                job = BackgroundJob.objects.get(id=job_id)
                # If the task returns a dict, store it as result_data
                result = retval if isinstance(retval, dict) else {"result": retval}
                job.mark_completed(result_data=result)
                logger.info(f"Job {job_id} completed.")
            except BackgroundJob.DoesNotExist:
                logger.warning(f"Job {job_id} succeeded but model not found.")
