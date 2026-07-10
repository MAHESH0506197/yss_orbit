# yss_orbit\backend\apps\payroll\events\event_handlers.py
from apps.payroll.events.events import PayrollEvents
import logging

logger = logging.getLogger(__name__)

def handle_payroll_run_completed(event_payload: dict):
    payroll_run_id = event_payload.get("payroll_run_id")
    logger.info(f"Handling payroll run completed for {payroll_run_id}")
    

def handle_payslip_disbursed(event_payload: dict):
    payslip_id = event_payload.get("payslip_id")
    logger.info(f"Handling payslip disbursed for {payslip_id}")
    
