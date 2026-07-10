# yss_orbit\backend\apps\hrms\api\serializers\employee_serializer.py
from __future__ import annotations

from rest_framework import serializers

from apps.hrms.models import Employee, EmployeeDocument


class EmployeeListSerializer(serializers.ModelSerializer):
    """Minimal representation for list views."""
    department_name = serializers.CharField(source="department.name", read_only=True, allow_null=True)
    designation_name = serializers.CharField(source="designation.name", read_only=True, allow_null=True)

    class Meta:
        model = Employee
        fields = [
            "id", "employee_code", "first_name", "last_name", "photo_url",
            "personal_email", "work_email", "phone", "employment_type", "employment_status",
            "department", "department_name", "designation", "designation_name",
            "date_of_joining", "is_active", "user_id", "business_unit_id", "reporting_manager_id"
        ]
        read_only_fields = ["id"]


class EmployeeDetailSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True, allow_null=True)
    designation_name = serializers.CharField(source="designation.name", read_only=True, allow_null=True)
    linked_user_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            "id", "employee_code", "first_name", "last_name", "middle_name", "photo_url",
            "personal_email", "work_email", "phone", "employment_type", "employment_status",
            "gender", "marital_status", "date_of_birth", "nationality", "blood_group",
            "department", "department_name", "designation", "designation_name",
            "reporting_manager_id", "date_of_joining", "date_of_leaving", "resignation_date",
            "probation_end_date", "confirmation_date",
            "pan_number", "aadhaar_number", "passport_number", "pf_number", "esi_number",
            "bank_account_number", "bank_name", "bank_ifsc",
            "permanent_address", "current_address",
            "emergency_contact_name", "emergency_contact_phone",
            "basic_salary", "ctc",
            "is_active", "created_at", "updated_at", "user_id", "linked_user_name", "business_unit_id",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "department_name", "designation_name", "linked_user_name"]

    def get_linked_user_name(self, obj):
        if not obj.user_id:
            return None
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.filter(id=obj.user_id).first()
        if user:
            return f"{user.first_name} {user.last_name}".strip() or user.email
        return "Unknown User"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        # Determine if we should mask PII/Salary
        mask_pii = True
        if request and hasattr(request, 'security_context'):
            ctx = request.security_context
            # Can see PII if they have the manage permission OR if they are viewing their own profile
            if ctx.has_permission('hrms.employees.manage') or ctx.effective_user_id == instance.user_id:
                mask_pii = False
                
        if mask_pii:
            pii_fields = [
                "pan_number", "aadhaar_number", "passport_number", "pf_number", "esi_number",
                "bank_account_number", "bank_name", "bank_ifsc", "basic_salary", "ctc",
                "date_of_birth", "emergency_contact_phone", "permanent_address"
            ]
            for field in pii_fields:
                if field in data:
                    data[field] = "*** MASKED ***" if data[field] else data[field]
                    
        return data


class EmployeeCreateSerializer(serializers.ModelSerializer):
    employee_code = serializers.CharField(max_length=30, required=False, allow_blank=True)

    class Meta:
        model = Employee
        fields = [
            "employee_code", "first_name", "last_name", "middle_name", "photo_url",
            "personal_email", "work_email", "phone", "employment_type", "employment_status",
            "department", "designation", "reporting_manager_id",
            "date_of_joining", "basic_salary", "ctc", "probation_end_date", "confirmation_date",
            "gender", "date_of_birth", "marital_status", "nationality", "blood_group",
            "pan_number", "aadhaar_number", "passport_number", "pf_number", "esi_number",
            "bank_account_number", "bank_name", "bank_ifsc",
            "permanent_address", "current_address",
            "emergency_contact_name", "emergency_contact_phone",
        ]

    def validate_employee_code(self, value):
        if not value:
            import uuid
            return f"EMP-{str(uuid.uuid4())[:8].upper()}"
        return value.strip().upper()


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDocument
        fields = [
            "id", "employee", "document_type", "name",
            "file_url", "file_size", "mime_type",
            "is_verified", "uploaded_by_id", "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]