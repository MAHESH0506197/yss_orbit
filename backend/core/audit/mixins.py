import logging
from django.db import models
from .models import AuditLog
from .middleware import get_current_user, get_current_ip, get_current_tenant_id

logger = logging.getLogger(__name__)

class AuditableModel(models.Model):
    """
    Mixin to automatically write AuditLog entries on save() and delete().
    Captures before/after state (old_values, new_values).
    """
    AUDIT_EXCLUDE_FIELDS = ['password']

    class Meta:
        abstract = True

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_state = self._get_current_state()

    def _get_current_state(self):
        if not self.pk:
            return {}
        state = {}
        for field in self._meta.fields:
            if field.name in self.AUDIT_EXCLUDE_FIELDS:
                continue
            try:
                # Get a serializable value
                val = field.value_from_object(self)
                # Convert UUIDs to strings just in case
                import uuid
                if isinstance(val, uuid.UUID):
                    val = str(val)
                state[field.name] = val
            except Exception:
                pass
        return state

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_values = {} if is_new else self._original_state
        
        super().save(*args, **kwargs)
        
        try:
            new_values = self._get_current_state()
            action = f"{self.__class__.__name__.upper()}_{'CREATE' if is_new else 'UPDATE'}"
            
            changes = {
                "old_values": old_values,
                "new_values": new_values
            }
            
            self._write_audit_log(action, changes)
        except Exception as e:
            logger.error(f"Audit log write failed on save: {e}")

        # Update state after save
        self._original_state = self._get_current_state()

    def delete(self, *args, **kwargs):
        try:
            action = f"{self.__class__.__name__.upper()}_DELETE"
            changes = {
                "old_values": self._original_state,
                "new_values": {}
            }
            self._write_audit_log(action, changes)
        except Exception as e:
            logger.error(f"Audit log write failed on delete: {e}")
            
        super().delete(*args, **kwargs)

    def _write_audit_log(self, action, changes):
        try:
            user = get_current_user()
            actor_id = user.pk if (user and user.is_authenticated) else None
            
            AuditLog.objects.create(
                tenant_id=get_current_tenant_id(),
                actor_id_id=actor_id,
                action=action,
                resource_type=self.__class__.__name__,
                resource_id=str(self.pk),
                changes=changes,
                ip_address=get_current_ip()
            )
        except Exception as e:
            logger.error(f"Audit log write failed: {e}")
