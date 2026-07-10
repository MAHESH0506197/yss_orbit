# yss_orbit\backend\apps\payroll\events\events.py
import logging

logger = logging.getLogger(__name__)

class PayrollEvents:
    PAYROLL_RUN_STARTED = "payroll.run.started"
    PAYROLL_RUN_COMPLETED = "payroll.run.completed"
    PAYROLL_RUN_FAILED = "payroll.run.failed"
    PAYSLIP_GENERATED = "payroll.payslip.generated"
    PAYSLIP_DISBURSED = "payroll.payslip.disbursed"
