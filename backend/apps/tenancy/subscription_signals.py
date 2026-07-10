# yss_orbit/backend/apps/subscription/signals.py
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.tenancy.models import PlatformModule
from apps.iam.models import RbacModule

logger = logging.getLogger(__name__)

@receiver(post_save, sender=PlatformModule)
def sync_platform_module_to_rbac(sender, instance, created, **kwargs):
    """
    Auto-sync PlatformModule to RbacModule.
    Ensures that when a new SaaS module is added to the Module Registry,
    the corresponding RBAC Module is automatically created/updated so 
    permissions and roles can be assigned.
    """
    try:
        rbac_module, was_created = RbacModule.objects.update_or_create(
            code=instance.code,
            defaults={
                'title': instance.name,
                'description': instance.description,
                'icon': instance.icon,
                'is_active': instance.is_active,
            }
        )
        action = "Created" if was_created else "Updated"
        logger.info(f"{action} RbacModule '{rbac_module.title}' from PlatformModule '{instance.name}'")
    except Exception as e:
        logger.error(f"Failed to sync PlatformModule '{instance.name}' to RbacModule: {e}")
