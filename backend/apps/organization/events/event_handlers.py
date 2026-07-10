# yss_orbit\backend\apps\user_business_unit\events\event_handlers.py
import logging
from .events import (
    MembershipCreatedEvent, 
    MembershipUpdatedEvent, 
    MembershipDeactivatedEvent,
    MembershipTransferredEvent
)
from apps.iam.services.rbac_service import RBACService
from apps.organization.models.user_business_unit_model import UserBusinessUnitModel
from core.audit.audit_service import AuditService

logger = logging.getLogger(__name__)

def handle_membership_created(event: MembershipCreatedEvent):
    logger.info(f"Membership created: {event.membership_id} for user {event.user_id} in BU {event.business_unit_id}")
    RBACService.invalidate_user_permissions(event.user_id, event.business_unit_id)
    AuditService.record(
        action="UBU_MEMBERSHIP_CREATED",
        resource="UserBusinessUnitModel",
        resource_id=str(event.membership_id),
        changes={
            "user_id": str(event.user_id), 
            "business_unit_id": str(event.business_unit_id),
            "role_id": str(event.role)
        }
    )

def handle_membership_updated(event: MembershipUpdatedEvent):
    logger.info(f"Membership updated: {event.membership_id}. Fields changed: {event.updated_fields}")
    # We need user_id and bu_id. For safety, just fetch it if needed.
    # In a real event bus, the event might have these fields. 
    # Let's get it from DB.
    try:
        membership = UserBusinessUnitModel.objects.get(id=event.membership_id)
        RBACService.invalidate_user_permissions(membership.user_id, membership.business_unit_id)
        AuditService.record(
            action="UBU_MEMBERSHIP_UPDATED",
            resource="UserBusinessUnitModel",
            resource_id=str(event.membership_id),
            changes={"updated_fields": event.updated_fields}
        )
    except UserBusinessUnitModel.DoesNotExist:
        pass

def handle_membership_deactivated(event: MembershipDeactivatedEvent):
    logger.info(f"Membership deactivated: {event.membership_id}")
    try:
        membership = UserBusinessUnitModel.objects.get(id=event.membership_id)
        RBACService.invalidate_user_permissions(membership.user_id, membership.business_unit_id)
        AuditService.record(
            action="UBU_MEMBERSHIP_DEACTIVATED",
            resource="UserBusinessUnitModel",
            resource_id=str(event.membership_id),
            changes={}
        )
    except UserBusinessUnitModel.DoesNotExist:
        pass

def handle_membership_transferred(event: MembershipTransferredEvent):
    logger.info(f"Membership transferred for user {event.user_id} from BU {event.old_business_unit_id} to BU {event.new_business_unit_id}")
    RBACService.invalidate_user_permissions(event.user_id, event.old_business_unit_id)
    RBACService.invalidate_user_permissions(event.user_id, event.new_business_unit_id)
    AuditService.record(
        action="UBU_MEMBERSHIP_TRANSFERRED",
        resource="UserBusinessUnitModel",
        resource_id=str(event.new_membership_id),
        changes={
            "user_id": str(event.user_id),
            "old_membership_id": str(event.old_membership_id),
            "new_business_unit_id": str(event.new_business_unit_id),
        }
    )
