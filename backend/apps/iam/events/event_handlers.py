# yss_orbit\backend\apps\rbac\events\event_handlers.py
import logging
from .events import RoleCreatedEvent, RoleUpdatedEvent, RoleDeletedEvent

logger = logging.getLogger(__name__)

def handle_role_created(event: RoleCreatedEvent):
    logger.info(f"Role created: {event.role_name} ({event.role_id})")

def handle_role_updated(event: RoleUpdatedEvent):
    logger.info(f"Role updated: {event.role_id}. Fields: {event.updated_fields}")

def handle_role_deleted(event: RoleDeletedEvent):
    logger.info(f"Role deleted: {event.role_id}")
