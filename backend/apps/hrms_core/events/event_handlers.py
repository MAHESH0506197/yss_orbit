# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\events\event_handlers.py
import logging
from django.dispatch import receiver
from apps.platform.signals import custom_event_signal
from apps.hrms_core.events.events import EmployeeEvents

logger = logging.getLogger(__name__)

@receiver(custom_event_signal, sender=EmployeeEvents.EMPLOYEE_CREATED)
def handle_employee_created(sender, **kwargs):
    employee_id = kwargs.get("employee_id")
    logger.info(f"Handling Employee Created Event for Employee: {employee_id}")
    # Add external integrations, welcome email logic here
