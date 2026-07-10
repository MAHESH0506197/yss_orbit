# yss_orbit\backend\core\orchestration\compensation_handler.py
import logging
from typing import List, Dict, Any
from .workflow_step import WorkflowStep

logger = logging.getLogger(__name__)

class CompensationHandler:
    """Handles the rollback (compensation) of executed steps in a Saga."""
    
    @staticmethod
    async def compensate(
        steps: List[WorkflowStep],
        completed_step_indices: List[int],
        context: Dict[str, Any]
    ) -> None:
        """
        Executes compensation for all completed steps in reverse order.
        """
        logger.info("Starting compensation process...")
        # Reverse the indices to compensate from last completed to first
        for idx in reversed(completed_step_indices):
            step = steps[idx]
            if step.compensation:
                logger.info(f"Executing compensation for step: {step.name}")
                try:
                    await step.compensate(context)
                    logger.info(f"Compensation successful for step: {step.name}")
                except Exception as e:
                    logger.error(f"Compensation failed for step {step.name}: {e}", exc_info=True)
                    # In a robust system, we might want to flag for manual intervention here
            else:
                logger.info(f"No compensation defined for step: {step.name}, skipping.")
