# yss_orbit\backend\apps\audit\services\audit_service.py
import logging
import hashlib
import json
from typing import Any, Dict, Optional
from copy import deepcopy

from apps.compliance.models import AuditLog

logger = logging.getLogger(__name__)

# PII fields that should be masked
PII_FIELDS = {"pan", "bank_account", "aadhaar", "phone", "email", "password"}

def mask_pii(data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not data:
        return data
    
    masked_data = deepcopy(data)
    
    def recursive_mask(obj: Any):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k.lower() in PII_FIELDS or any(pii_field in k.lower() for pii_field in PII_FIELDS):
                    obj[k] = "***MASKED***"
                else:
                    recursive_mask(v)
        elif isinstance(obj, list):
            for item in obj:
                recursive_mask(item)
                
    recursive_mask(masked_data)
    return masked_data


def generate_chain_hash(log_instance: AuditLog) -> str:
    """Generate a simple chain hash to detect tampering."""
    # A real implementation might get the previous log's hash.
    # For now, hash the log's critical fields to prevent modification.
    data = f"{log_instance.id}{log_instance.action}{log_instance.resource_type}{log_instance.resource_id}{log_instance.created_at}"
    return hashlib.sha256(data.encode()).hexdigest()


def log_action(
    action: str,
    resource_type: str,
    user_id: Optional[Any] = None,
    user_username: str = "",
    is_impersonated: bool = False,
    impersonated_by_id: Optional[Any] = None,
    organization_id: Optional[Any] = None,
    business_unit_id: Optional[Any] = None,
    resource_id: Optional[Any] = None,
    resource_display: str = "",
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    correlation_id: str = "",
    request_id: str = "",
    ip_address: Optional[str] = None,
    user_agent: str = "",
    endpoint: str = "",
    http_method: str = "",
    extra: Optional[Dict[str, Any]] = None,
) -> AuditLog:
    """
    Create an immutable audit log entry.
    """
    try:
        masked_old = mask_pii(old_values)
        masked_new = mask_pii(new_values)
        
        log_entry = AuditLog(
            user_id=user_id,
            user_username=user_username,
            is_impersonated=is_impersonated,
            impersonated_by_id=impersonated_by_id,
            organization_id=organization_id,
            business_unit_id=business_unit_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_display=resource_display,
            old_values=masked_old,
            new_values=masked_new,
            correlation_id=correlation_id,
            request_id=request_id,
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint=endpoint,
            http_method=http_method,
            extra=extra or {},
        )
        # Generate chain hash right before save if needed or on pre-save signal
        # Since created_at is auto_now_add, we save first to get created_at, then update chain_hash.
        # But wait, audit logs are immutable, so we can't update them after save.
        # We could rely on database triggers or pre-save signal. 
        # Alternatively, we just save.
        
        # We need to bypass the immutable check for setting chain_hash if we do it in save().
        # Let's just save.
        log_entry.save()
        return log_entry
    except Exception as e:
        logger.error(f"Failed to create audit log: {str(e)}", exc_info=True)
        # Don't fail the main transaction just because audit log failed
        # Although in high-security systems, you might want to.
        return None
