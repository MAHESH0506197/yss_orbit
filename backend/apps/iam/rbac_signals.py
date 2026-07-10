import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from apps.iam.models.rbac_models import UserRole, RolePermission, UserPermissionOverride
from apps.iam.services.rbac_service import RBACService

logger = logging.getLogger(__name__)

@receiver(post_save, sender=UserRole)
@receiver(post_delete, sender=UserRole)
def invalidate_cache_on_user_role_change(sender, instance, **kwargs):
    """Invalidate cache when a user is assigned or removed from a role."""
    logger.debug(f"Invalidating RBAC cache for user {instance.user_id} in BU {instance.business_unit_id}")
    RBACService.invalidate_user_permissions(instance.user_id, instance.business_unit_id)

@receiver(post_save, sender=RolePermission)
@receiver(post_delete, sender=RolePermission)
def invalidate_cache_on_role_permission_change(sender, instance, **kwargs):
    """Invalidate cache for all users holding a role when its permissions change."""
    role = instance.role
    # Invalidate cache for all active users assigned to this role
    # Note: UserRole includes business_unit_id which is needed for the cache key
    user_roles = role.user_roles.filter(is_active=True).values('user_id', 'business_unit_id')
    
    count = 0
    for ur in user_roles:
        RBACService.invalidate_user_permissions(ur['user_id'], ur['business_unit_id'])
        count += 1
        
    logger.debug(f"Invalidated RBAC cache for {count} users due to RolePermission change on role {role.id}")

@receiver(post_save, sender=UserPermissionOverride)
@receiver(post_delete, sender=UserPermissionOverride)
def invalidate_cache_on_user_override_change(sender, instance, **kwargs):
    """Invalidate cache when a user's permission overrides change."""
    logger.debug(f"Invalidating RBAC cache for user {instance.user_id} in BU {instance.business_unit_id} due to override change")
    RBACService.invalidate_user_permissions(instance.user_id, instance.business_unit_id)

# ─── Soft-Delete Cascading ───────────────────────────────────────────────────

from apps.organization.events.events import business_unit_deleted

@receiver(business_unit_deleted)
def cascade_soft_delete_rbac_on_bu_delete(sender, bu, **kwargs):
    """
    When a Business Unit is soft-deleted, we must clean up its RBAC records.
    - Soft delete all Roles (BaseModel)
    - Deactivate all UserRoles
    - Deactivate all UserPermissionOverrides
    """
    from apps.iam.models.rbac_models import Role, UserRole, UserPermissionOverride
    from apps.organization.models.user_business_unit_model import UserBusinessUnitModel
    from django.utils import timezone
    
    logger.info(f"Cascading soft-delete to RBAC and UBU for deleted BU {bu.id}")
    now = timezone.now()
    
    # 1. Soft delete all roles for this BU
    roles = Role.objects.filter(business_unit_id=bu.id, is_deleted=False)
    roles.update(is_deleted=True, is_active=False, deleted_at=now, deleted_by_id=bu.deleted_by_id)
    
    # 2. Deactivate active UserRoles for this BU
    user_roles = UserRole.objects.filter(business_unit_id=bu.id, is_active=True)
    user_roles.update(is_active=False, revoked_at=now)
    
    # 3. Delete/deactivate permission overrides
    UserPermissionOverride.objects.filter(business_unit_id=bu.id).delete()
    
    # 4. Soft delete UserBusinessUnitModel memberships
    ubus = UserBusinessUnitModel.objects.filter(business_unit_id=bu.id, is_deleted=False)
    ubus.update(is_deleted=True, is_active=False, is_active_membership=False, deleted_at=now, deleted_by_id=bu.deleted_by_id)
