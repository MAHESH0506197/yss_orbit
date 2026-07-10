# yss_orbit\backend\apps\api_consumer_key\authentication.py
from __future__ import annotations

import logging
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request

from apps.platform.models import APIConsumerKey
from apps.iam.security_context import SecurityContext

logger = logging.getLogger(__name__)

class APIKeyAuthentication(BaseAuthentication):
    """
    API key authentication for machine-to-machine access.
    Reads X-API-Key header and validates against api_consumer_key records.
    """

    def authenticate(self, request: Request) -> tuple[None, None] | None:
        api_key_header = request.headers.get("X-API-Key")
        if not api_key_header:
            return None

        # Key format assumption: prefix.secret (e.g., abcdefghij.restofsecret)
        # We look up by the first 10 chars (key_prefix)
        prefix = api_key_header[:10]
        
        try:
            # We don't have BU context yet, we might need to search across tenant models?
            # Normally API keys are scoped to a BU. Let's see if BU is in header.
            bu_id_header = request.headers.get("X-Business-Unit-Id")
            
            if bu_id_header:
                api_key_obj = APIConsumerKey.objects.filter(
                    key_prefix=prefix, 
                    business_unit_id=bu_id_header,
                    is_active=True,
                    is_deleted=False
                ).first()
            else:
                # If no BU is provided, we just find the active key with the prefix
                api_key_obj = APIConsumerKey.objects.filter(
                    key_prefix=prefix,
                    is_active=True,
                    is_deleted=False
                ).first()

            if not api_key_obj:
                raise AuthenticationFailed("Invalid API Key.")
                
            # Verify the full key
            if not api_key_obj.verify_key(api_key_header):
                raise AuthenticationFailed("Invalid API Key.")

            # Verify expiration
            if api_key_obj.expires_at and api_key_obj.expires_at < timezone.now():
                raise AuthenticationFailed("API Key has expired.")

            # Update last used
            api_key_obj.last_used_at = timezone.now()
            api_key_obj.save(update_fields=['last_used_at'])
            
            # Construct SecurityContext
            correlation_id = getattr(request, 'correlation_id', 'unknown')
            
            security_context = SecurityContext(
                user_id=api_key_obj.user_id,
                business_unit_id=api_key_obj.business_unit_id,
                permissions=frozenset(api_key_obj.permissions),
                correlation_id=correlation_id,
                is_super_admin=False
            )
            
            request.security_context = security_context
            
            # We return (user, auth) equivalent. We'll return (api_key_obj.user_id, api_key_obj)
            class ImplementedUser:
                is_authenticated = True
                
            return (ImplementedUser(), api_key_obj)

        except AuthenticationFailed:
            raise
        except Exception as e:
            logger.error(f"Error authenticating API key: {e}")
            raise AuthenticationFailed("Invalid API Key.")
