import uuid
from decimal import Decimal
from django.db import transaction

from apps.hrms.models import LeaveBalance, Employee


class LeaveEncashmentService:
    """
    Foundation for future leave encashment workflows.
    """

    @classmethod
    @transaction.atomic
    def encash_leave(cls, bu_id: uuid.UUID, employee_id: uuid.UUID, leave_type_id: uuid.UUID, year: int, days_to_encash: Decimal) -> LeaveBalance:
        """
        Encashes leave and updates the balance.
        """
        balance = LeaveBalance.objects.select_for_update().get(
            business_unit_id=bu_id,
            employee_id=employee_id,
            leave_type_id=leave_type_id,
            year=year
        )
        
        if balance.closing_balance < days_to_encash:
            raise ValueError("Insufficient balance for encashment.")
            
        balance.encashed_days += days_to_encash
        balance.save(update_fields=['encashed_days'])
        
        from .leave_allocation_service import LeaveAllocationService
        LeaveAllocationService.recalculate_closing_balance(balance)
        
        return balance
