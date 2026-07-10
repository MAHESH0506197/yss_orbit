# yss_orbit\backend\apps\outbox\orchestrators\outbox_orchestrator.py
from apps.platform.services.outbox_processor_service import OutboxProcessorService

class OutboxOrchestrator:
    @classmethod
    def process(cls, batch_size: int = 50) -> int:
        """
        Orchestrates the processing of pending messages in the outbox.
        """
        return OutboxProcessorService.execute(batch_size=batch_size)
