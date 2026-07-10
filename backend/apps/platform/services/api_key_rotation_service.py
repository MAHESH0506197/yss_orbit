# yss_orbit\backend\apps\api_consumer_key\services\api_key_rotation_service.py
import uuid
from apps.platform.models import APIConsumerKey, APIKeyAudit
from django.utils import timezone

class APIKeyRotationService:
    @staticmethod
    def rotate_key(key_id: uuid.UUID, business_unit_id: uuid.UUID, user_id: uuid.UUID) -> tuple[APIConsumerKey, str]:
        """
        Creates a new key to replace an existing one, and schedules the old one for expiry 
        if it wasn't already.
        """
        # Get old key
        old_key = APIConsumerKey.objects.get(id=key_id, business_unit_id=business_unit_id)
        
        # Create new key with same properties
        from .api_key_service import APIKeyService
        new_key, plaintext = APIKeyService.create_key(
            business_unit_id=business_unit_id,
            name=f"{old_key.name} (Rotated)",
            user_id=user_id,
            permissions=old_key.permissions,
            expires_at=old_key.expires_at
        )
        
        # Soft expire the old key (give it 7 days if it didn't have a shorter expiry)
        now = timezone.now()
        grace_period = now + timezone.timedelta(days=7)
        if not old_key.expires_at or old_key.expires_at > grace_period:
            old_key.expires_at = grace_period
            old_key.save(update_fields=["expires_at"])
            
        return new_key, plaintext
