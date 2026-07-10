# yss_orbit\backend\apps\recruitment\events\event_handlers.py
import logging
from apps.recruitment.events.events import RecruitmentEvents

logger = logging.getLogger(__name__)

def handle_application_submitted(event_payload: dict):
    application_id = event_payload.get("application_id")
    logger.info(f"Handling application submitted for {application_id}")

def handle_interview_scheduled(event_payload: dict):
    interview_id = event_payload.get("interview_id")
    logger.info(f"Handling interview scheduled for {interview_id}")
