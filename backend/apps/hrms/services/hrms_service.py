# yss_orbit\backend\apps\hrms\services\hrms_service.py
"""
YSS Orbit — HRMS Service
Business logic for HR domain: employees, departments, designations, documents.
All operations tenant-scoped via business_unit_id.
"""
from __future__ import annotations

import uuid
from typing import Any

from django.db import transaction
from django.db.models import Q, QuerySet

from apps.hrms.models import Department, Designation, Employee, EmployeeDocument


class HRMSService:
    """
    Service layer for the HRMS domain.
    All reads/writes are scoped to business_unit_id.
    """

    # ─── Departments ─────────────────────────────────────────────────────────

    def list_departments(self, bu_id: uuid.UUID) -> QuerySet:
        return Department.objects.filter(business_unit_id=bu_id).order_by("name")

    def get_department(self, bu_id: uuid.UUID, dept_id: uuid.UUID) -> Department:
        return Department.objects.get(business_unit_id=bu_id, id=dept_id)

    def create_department(self, bu_id: uuid.UUID, data: dict, created_by_id: uuid.UUID) -> Department:
        data.pop("business_unit_id", None)
        data["created_by_id"] = created_by_id
        return Department.objects.create(business_unit_id=bu_id, **data)

    def update_department(self, bu_id: uuid.UUID, dept_id: uuid.UUID, data: dict, updated_by_id: uuid.UUID) -> Department:
        dept = self.get_department(bu_id, dept_id)
        data.pop("business_unit_id", None)
        data["updated_by_id"] = updated_by_id
        for k, v in data.items():
            setattr(dept, k, v)
        dept.save()
        return dept

    def deactivate_department(self, bu_id: uuid.UUID, dept_id: uuid.UUID, deleted_by_id: uuid.UUID) -> Department:
        dept = self.get_department(bu_id, dept_id)
        dept.soft_delete(deleted_by_id=deleted_by_id)
        return dept

    # ─── Designations ─────────────────────────────────────────────────────────

    def list_designations(self, bu_id: uuid.UUID, dept_id: uuid.UUID | None = None) -> QuerySet:
        qs = Designation.objects.filter(business_unit_id=bu_id).select_related("department")
        if dept_id:
            qs = qs.filter(department_id=dept_id)
        return qs.order_by("name")

    def get_designation(self, bu_id: uuid.UUID, des_id: uuid.UUID) -> Designation:
        return Designation.objects.get(business_unit_id=bu_id, id=des_id)

    def create_designation(self, bu_id: uuid.UUID, data: dict, created_by_id: uuid.UUID) -> Designation:
        data.pop("business_unit_id", None)
        data["created_by_id"] = created_by_id
        return Designation.objects.create(business_unit_id=bu_id, **data)

    def update_designation(self, bu_id: uuid.UUID, des_id: uuid.UUID, data: dict, updated_by_id: uuid.UUID) -> Designation:
        des = self.get_designation(bu_id, des_id)
        data.pop("business_unit_id", None)
        data["updated_by_id"] = updated_by_id
        for k, v in data.items():
            setattr(des, k, v)
        des.save()
        return des

    # ─── Employees ─────────────────────────────────────────────────────────────

    def list_employees(self, bu_id: uuid.UUID, filters: dict | None = None) -> QuerySet:
        qs = Employee.objects.filter(business_unit_id=bu_id).select_related(
            "department", "designation"
        )
        if filters:
            if filters.get("search"):
                q = filters["search"]
                qs = qs.filter(
                    Q(first_name__icontains=q)
                    | Q(last_name__icontains=q)
                    | Q(employee_code__icontains=q)
                    | Q(personal_email__icontains=q)
                    | Q(work_email__icontains=q)
                )
            if filters.get("department_id"):
                qs = qs.filter(department_id=filters["department_id"])
            if filters.get("employment_status"):
                qs = qs.filter(employment_status=filters["employment_status"])
            if filters.get("employment_type"):
                qs = qs.filter(employment_type=filters["employment_type"])
        return qs.order_by("first_name", "last_name")

    def get_employee(self, bu_id: uuid.UUID, emp_id: uuid.UUID) -> Employee:
        return Employee.objects.select_related(
            "department", "designation"
        ).get(business_unit_id=bu_id, id=emp_id)

    @transaction.atomic
    def create_employee(self, bu_id: uuid.UUID, data: dict, created_by_id: uuid.UUID) -> Employee:
        data.pop("business_unit_id", None)
        data["created_by_id"] = created_by_id
        data.setdefault("employment_status", Employee.EmploymentStatus.ACTIVE)
        
        # Assign General Shift by default if no shift is provided
        from apps.hrms.models import Shift
        if "shift_id" not in data and "shift" not in data:
            general_shift = Shift.objects.filter(business_unit_id=bu_id, name="General Shift").first()
            if general_shift:
                data["shift"] = general_shift
                
        emp = Employee.objects.create(business_unit_id=bu_id, **data)
        
        from apps.platform.services.outbox_service import OutboxService
        OutboxService.publish(
            message_type="employee.created",
            destination="employee_events",
            payload={
                "employee_id": str(emp.id),
                "business_unit_id": str(emp.business_unit_id),
                "employee_code": emp.employee_code,
                "first_name": emp.first_name,
                "last_name": emp.last_name,
                "email": emp.work_email or emp.personal_email,
                "department_id": str(emp.department_id) if emp.department_id else None,
                "designation_id": str(emp.designation_id) if emp.designation_id else None,
            }
        )
        return emp

    @transaction.atomic
    def update_employee(
        self,
        bu_id: uuid.UUID,
        emp_id: uuid.UUID,
        data: dict,
        updated_by_id: uuid.UUID,
    ) -> Employee:
        emp = self.get_employee(bu_id, emp_id)
        data.pop("business_unit_id", None)
        data["updated_by_id"] = updated_by_id
        for k, v in data.items():
            setattr(emp, k, v)
        emp.save()

        from apps.platform.services.outbox_service import OutboxService
        OutboxService.publish(
            message_type="employee.updated",
            destination="employee_events",
            payload={
                "employee_id": str(emp.id),
                "business_unit_id": str(emp.business_unit_id),
                "employee_code": emp.employee_code,
                "first_name": emp.first_name,
                "last_name": emp.last_name,
                "email": emp.work_email or emp.personal_email,
                "department_id": str(emp.department_id) if emp.department_id else None,
                "designation_id": str(emp.designation_id) if emp.designation_id else None,
            }
        )

        return emp

    def deactivate_employee(self, bu_id: uuid.UUID, emp_id: uuid.UUID, deleted_by_id: uuid.UUID) -> Employee:
        emp = self.get_employee(bu_id, emp_id)
        emp.employment_status = Employee.EmploymentStatus.RESIGNED
        emp.updated_by_id = deleted_by_id
        emp.soft_delete(deleted_by_id=deleted_by_id)
        
        from apps.platform.services.outbox_service import OutboxService
        OutboxService.publish(
            message_type="employee.terminated",
            destination="employee_events",
            payload={
                "employee_id": str(emp.id),
                "business_unit_id": str(emp.business_unit_id),
                "employee_code": emp.employee_code,
                "first_name": emp.first_name,
                "last_name": emp.last_name,
            }
        )
        return emp

    # ─── Employee Documents ───────────────────────────────────────────────────

    def list_documents(self, bu_id: uuid.UUID, emp_id: uuid.UUID) -> QuerySet:
        return EmployeeDocument.objects.filter(
            business_unit_id=bu_id, employee_id=emp_id
        ).order_by("-created_at")

    def create_document(
        self,
        bu_id: uuid.UUID,
        emp_id: uuid.UUID,
        data: dict,
        created_by_id: uuid.UUID,
    ) -> EmployeeDocument:
        # Validate employee belongs to BU
        self.get_employee(bu_id, emp_id)
        data.pop("business_unit_id", None)
        data["employee_id"] = emp_id
        data["created_by_id"] = created_by_id
        return EmployeeDocument.objects.create(business_unit_id=bu_id, **data)

    def verify_document(
        self,
        bu_id: uuid.UUID,
        doc_id: uuid.UUID,
        verified_by_id: uuid.UUID,
    ) -> EmployeeDocument:
        doc = EmployeeDocument.objects.get(business_unit_id=bu_id, id=doc_id)
        doc.is_verified = True
        doc.verified_by_id = verified_by_id
        doc.updated_by_id = verified_by_id
        doc.save(update_fields=["is_verified", "verified_by_id", "updated_by_id", "updated_at"])
        return doc
