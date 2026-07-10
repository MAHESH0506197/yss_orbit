# yss_orbit\backend\apps\tenant_settings\orchestrators\tenant_settings_orchestrator.py
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class TenantSettingsOrchestrator:
    def __init__(self, service, repository):
        self.service = service
        self.repository = repository
        
    def execute(self, data: Dict[str, Any]):
        logger.info(f"Orchestrating workflow in TenantSettingsOrchestrator")
        processed = self.service.process(data)
        if processed:
            return self.repository.create(**data)
        return None
