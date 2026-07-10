# yss_orbit\backend\apps\attendance\events\event_handlers.py
import logging
from django.dispatch import receiver
from apps.platform.signals import custom_event_signal
from apps.attendance.events.events import AttendanceEvents

logger = logging.getLogger(__name__)

@receiver(custom_event_signal, sender=AttendanceEvents.CHECK_IN)
def handle_check_in(sender, **kwargs):
    employee_id = kwargs.get("employee_id")
    timestamp = kwargs.get("timestamp")
    logger.info(f"Employee {employee_id} checked in at {timestamp}")

@receiver(custom_event_signal, sender=AttendanceEvents.CHECK_OUT)
def handle_check_out(sender, **kwargs):
    employee_id = kwargs.get("employee_id")
    timestamp = kwargs.get("timestamp")
    logger.info(f"Employee {employee_id} checked out at {timestamp}")
