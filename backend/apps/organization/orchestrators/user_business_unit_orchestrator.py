# yss_orbit\backend\apps\user_business_unit\orchestrators\user_business_unit_orchestrator.py
import logging
from django.db import transaction
from ..models.user_business_unit_model import UserBusinessUnitModel
from ..events.events import MembershipCreatedEvent
from ..events.event_handlers import handle_membership_created

logger = logging.getLogger(__name__)

class UserBusinessUnitOrchestrator:
    @transaction.atomic
    def assign_user_to_bu(self, user, business_unit, role=None):
        logger.info(f"Assigning user {user.id} to BU {business_unit.id}")
        membership, created = UserBusinessUnitModel.objects.get_or_create(
            user=user,
            business_unit=business_unit,
            defaults={"role": role}
        )
        if created:
            event = MembershipCreatedEvent(
                membership_id=str(membership.id),
                user_id=str(user.id),
                business_unit_id=str(business_unit.id),
                role=role
            )
            handle_membership_created(event)
        return membership

    @transaction.atomic
    def deactivate_membership(self, user, business_unit):
        membership = UserBusinessUnitModel.objects.filter(user=user, business_unit=business_unit).first()
        if membership:
            membership.is_active = False
            membership.save()
            logger.info(f"Deactivated membership for user {user.id} in BU {business_unit.id}")
        return membership
