# yss_orbit\backend\apps\api_consumer_key\services\api_key_service.py
import secrets
import uuid
from typing import Tuple, List, Optional
from django.utils import timezone
from apps.platform.models import APIConsumerKey

class APIKeyService:
    @staticmethod
    def create_key(business_unit_id: uuid.UUID, name: str, user_id: uuid.UUID, permissions: Optional[List[str]] = None, expires_at=None) -> Tuple[APIConsumerKey, str]:
        plaintext_key = secrets.token_urlsafe(64)
        
        api_key = APIConsumerKey(
            business_unit_id=business_unit_id,
            name=name,
            permissions=permissions or [],
            expires_at=expires_at,
            user_id=user_id,
            created_by_id=user_id,
        )
        api_key.set_key(plaintext_key)
        api_key.save()
        
        return api_key, plaintext_key
        
    @staticmethod
    def revoke_key(key_id: uuid.UUID, business_unit_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        try:
            key = APIConsumerKey.objects.get(id=key_id, business_unit_id=business_unit_id)
            key.soft_delete(deleted_by_id=user_id)
            return True
        except APIConsumerKey.DoesNotExist:
            return False
