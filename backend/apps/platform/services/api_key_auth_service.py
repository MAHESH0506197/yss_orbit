# yss_orbit\backend\apps\api_consumer_key\services\api_key_auth_service.py
from typing import Optional, Tuple
import uuid
from apps.platform.models import APIConsumerKey
from django.utils import timezone

class APIKeyAuthService:
    @staticmethod
    def authenticate(plaintext_key: str) -> Tuple[Optional[APIConsumerKey], Optional[str]]:
        """
        Authenticates an API key.
        Returns (APIConsumerKey, None) if successful.
        Returns (None, error_msg) if failed.
        """
        if not plaintext_key:
            return None, "Key not provided"
            
        key_prefix = plaintext_key[:10]
        
        # Look up by prefix first to avoid checking hash against all keys
        keys = APIConsumerKey.objects.filter(key_prefix=key_prefix, is_active=True)
        for key in keys:
            if key.verify_key(plaintext_key):
                if key.expires_at and key.expires_at < timezone.now():
                    return None, "Key has expired"
                # Update last used
                key.last_used_at = timezone.now()
                key.save(update_fields=["last_used_at"])
                return key, None
                
        return None, "Invalid API key"
