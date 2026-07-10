# yss_orbit\backend\core\orchestration\base_orchestrator.py
import logging
import uuid
from typing import List, Dict, Any, Optional
from .workflow_step import WorkflowStep
from .orchestrator_state import SagaState, SagaStatus
from .compensation_handler import CompensationHandler
from .workflow_audit import WorkflowAudit

logger = logging.getLogger(__name__)

class BaseOrchestrator:
    """
    Base class for defining and executing Saga workflows.
    Ensures that steps are executed in order, state is tracked, and compensations
    are triggered upon failure.
    """
    
    name: str = "BaseOrchestrator"
    
    def __init__(self, state_store: Any = None, audit: WorkflowAudit = None):
        self.steps: List[WorkflowStep] = self.define_steps()
        self.state_store = state_store  # Interface for persisting saga state
        self.audit = audit or WorkflowAudit()
        
    def define_steps(self) -> List[WorkflowStep]:
        """Override this method to define the workflow steps."""
        return None

    async def execute(self, initial_context: Dict[str, Any], saga_id: Optional[str] = None) -> SagaState:
        """
        Executes the saga. Tracks state and triggers compensation on failure.
        """
        saga_id = saga_id or str(uuid.uuid4())
        state = SagaState(saga_id=saga_id, name=self.name, context=initial_context)
        state.update_status(SagaStatus.IN_PROGRESS)
        
        self._save_state(state)
        
        completed_indices = []
        
        try:
            for idx, step in enumerate(self.steps):
                state.current_step_index = idx
                self._save_state(state)
                
                self.audit.log_step_start(saga_id, step.name)
                
                # Execute action
                result = await step.execute(state.context)
                
                # Update context if step returned dictionary
                if isinstance(result, dict):
                    state.context.update(result)
                    
                completed_indices.append(idx)
                self.audit.log_step_success(saga_id, step.name, result)
                self._save_state(state)
                
            state.update_status(SagaStatus.COMPLETED)
            self._save_state(state)
            return state

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Saga {saga_id} failed at step {state.current_step_index}: {error_msg}")
            
            # Log failure
            failed_step = self.steps[state.current_step_index]
            self.audit.log_step_failure(saga_id, failed_step.name, error_msg)
            
            # Initiate compensation
            state.update_status(SagaStatus.COMPENSATING, error=error_msg)
            self._save_state(state)
            
            await CompensationHandler.compensate(self.steps, completed_indices, state.context)
            
            state.update_status(SagaStatus.FAILED, error=error_msg)
            self._save_state(state)
            raise e

    def _save_state(self, state: SagaState):
        """Persists the saga state."""
        if self.state_store:
            self.state_store.save(state)
