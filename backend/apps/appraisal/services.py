# yss_orbit\backend\apps\appraisal\services.py
from .models import Appraisal, AppraisalCycle

class AppraisalService:
    @staticmethod
    def initiate_appraisals_for_cycle(cycle_id, employees):
        cycle = AppraisalCycle.objects.get(id=cycle_id)
        appraisals = []
        for emp in employees:
            appraisal, created = Appraisal.objects.get_or_create(
                business_unit_id=cycle.business_unit_id,
                employee=emp,
                cycle=cycle,
                defaults={'manager': emp.reporting_manager} # assuming reporting_manager exists
            )
            appraisals.append(appraisal)
        return appraisals
