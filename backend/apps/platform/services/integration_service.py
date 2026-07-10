# yss_orbit\backend\apps\integration\services\integration_service.py
import uuid
from typing import Dict, Any, Optional
from apps.platform.models import Integration

class IntegrationService:
    @staticmethod
    def create_integration(
        business_unit_id: uuid.UUID, 
        user_id: uuid.UUID, 
        name: str, 
        provider: str, 
        credentials: Dict[str, Any], 
        settings: Optional[Dict[str, Any]] = None
    ) -> Integration:
        integration = Integration.objects.create(
            business_unit_id=business_unit_id,
            name=name,
            provider=provider,
            credentials=credentials,
            settings=settings or {},
            created_by_id=user_id
        )
        return integration
        
    @staticmethod
    def update_integration(
        integration_id: uuid.UUID, 
        business_unit_id: uuid.UUID,
        user_id: uuid.UUID,
        name: Optional[str] = None,
        credentials: Optional[Dict[str, Any]] = None,
        settings: Optional[Dict[str, Any]] = None,
        is_active: Optional[bool] = None
    ) -> Optional[Integration]:
        try:
            integration = Integration.objects.get(id=integration_id, business_unit_id=business_unit_id)
            if name is not None:
                integration.name = name
            if credentials is not None:
                integration.credentials = credentials
            if settings is not None:
                integration.settings = settings
            if is_active is not None:
                integration.is_active = is_active
                
            integration.updated_by_id = user_id
            integration.save()
            return integration
        except Integration.DoesNotExist:
            return None
            
    @staticmethod
    def delete_integration(integration_id: uuid.UUID, business_unit_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        try:
            integration = Integration.objects.get(id=integration_id, business_unit_id=business_unit_id)
            integration.soft_delete(deleted_by_id=user_id)
            return True
        except Integration.DoesNotExist:
            return False
