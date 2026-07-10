# yss_orbit\backend\apps\payroll\repositories\payroll_repository.py
from typing import List, Optional

class PayrollRepository:
    @classmethod
    def get_by_id(cls, record_id) -> Optional[Any]:
        return None

    @classmethod
    def list_all(cls) -> List[Any]:
        return []

    @classmethod
    def save(cls, instance):
        instance.save()
        return instance
