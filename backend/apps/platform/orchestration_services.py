# yss_orbit\backend\apps\orchestration\services.py
import logging
from typing import Any, Dict, List, Optional
from django.db import transaction
from django.utils import timezone
from apps.platform.models import Saga, SagaStep, SagaStatus, SagaStepStatus

logger = logging.getLogger(__name__)

class SagaExecutionError(Exception):
    """Exception raised when a Saga step fails to execute."""
    pass

class BaseSagaOrchestrator:
    """
    Production-grade Orchestrator for Saga pattern execution.
    Subclasses must define `steps_definition` mapping step names to their 
    execute and compensate methods.
    """
    saga_type: str = "generic_saga"
    
    # Format:
    # [
    #    {"name": "step_1", "execute": func, "compensate": func},
    #    ...
    # ]
    steps_definition: List[Dict[str, Any]] = []

    @classmethod
    def start_saga(cls, payload: Dict[str, Any], correlation_id: str, business_unit_id: Optional[str] = None) -> Saga:
        with transaction.atomic():
            saga = Saga.objects.create(
                saga_type=cls.saga_type,
                payload=payload,
                correlation_id=correlation_id,
                business_unit_id=business_unit_id,
                status=SagaStatus.IN_PROGRESS
            )
            for index, step_def in enumerate(cls.steps_definition):
                SagaStep.objects.create(
                    saga=saga,
                    step_name=step_def["name"],
                    step_order=index
                )
        
        # In a robust production setup, _execute_next could be triggered 
        # via a message broker (e.g., Celery, RabbitMQ) to ensure fault tolerance.
        cls._execute_next(saga)
        return saga

    @classmethod
    def _execute_next(cls, saga: Saga):
        pending_step = saga.steps.filter(status=SagaStepStatus.PENDING).order_by("step_order").first()
        
        if not pending_step:
            saga.status = SagaStatus.COMPLETED
            saga.save(update_fields=["status", "updated_at"])
            logger.info(f"Saga {saga.id} of type {saga.saga_type} completed successfully.")
            return

        step_def = next((s for s in cls.steps_definition if s["name"] == pending_step.step_name), None)
        if not step_def:
            cls._fail_step(saga, pending_step, f"Step definition '{pending_step.step_name}' not found.")
            return

        try:
            logger.info(f"Executing step '{pending_step.step_name}' for Saga {saga.id}")
            # Ensure atomic execution for each step's business logic
            with transaction.atomic():
                result = step_def["execute"](saga.payload, pending_step.result_payload)
                
            pending_step.status = SagaStepStatus.COMPLETED
            pending_step.result_payload = result or {}
            pending_step.save(update_fields=["status", "result_payload", "updated_at"])
            
            # Recursively execute the next step
            cls._execute_next(saga)
            
        except Exception as e:
            logger.error(f"Error executing step '{pending_step.step_name}' for Saga {saga.id}: {str(e)}", exc_info=True)
            cls._fail_step(saga, pending_step, str(e))

    @classmethod
    def _fail_step(cls, saga: Saga, step: SagaStep, error_msg: str):
        step.status = SagaStepStatus.FAILED
        step.error_message = error_msg
        step.save(update_fields=["status", "error_message", "updated_at"])

        saga.status = SagaStatus.COMPENSATING
        saga.save(update_fields=["status", "updated_at"])
        
        cls._compensate(saga)

    @classmethod
    def _compensate(cls, saga: Saga):
        completed_steps = saga.steps.filter(status=SagaStepStatus.COMPLETED).order_by("-step_order")
        
        for step in completed_steps:
            step_def = next((s for s in cls.steps_definition if s["name"] == step.step_name), None)
            if step_def and step_def.get("compensate"):
                try:
                    logger.info(f"Compensating step '{step.step_name}' for Saga {saga.id}")
                    with transaction.atomic():
                        step_def["compensate"](saga.payload, step.result_payload)
                    step.status = SagaStepStatus.COMPENSATED
                except Exception as e:
                    logger.critical(
                        f"CRITICAL: Compensation failed for step '{step.step_name}' in Saga {saga.id}. "
                        f"Manual intervention required. Error: {str(e)}", 
                        exc_info=True
                    )
                    saga.status = SagaStatus.FAILED
                    saga.save(update_fields=["status", "updated_at"])
                    return
            else:
                step.status = SagaStepStatus.COMPENSATED
                
            step.save(update_fields=["status", "updated_at"])
        
        saga.status = SagaStatus.COMPENSATED
        saga.save(update_fields=["status", "updated_at"])
        logger.info(f"Saga {saga.id} of type {saga.saga_type} fully compensated.")
