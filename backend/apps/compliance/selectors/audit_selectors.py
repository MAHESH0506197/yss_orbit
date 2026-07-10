# yss_orbit\backend\apps\audit\selectors\audit_selectors.py
from typing import Dict, Any, List
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import QuerySet

def get_audit_by_id(model_class, obj_id: str) -> Dict[str, Any]:
    try:
        obj = model_class.objects.get(id=obj_id)
        return {"id": str(obj.id), "created_at": str(obj.created_at)}
    except ObjectDoesNotExist:
        return {}

def list_active_audit(model_class) -> QuerySet:
    return model_class.objects.filter(is_active=True).order_by('-created_at')
