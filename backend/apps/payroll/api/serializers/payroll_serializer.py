from rest_framework import serializers
from apps.payroll.models.payroll_run_model import PayrollRun
from apps.payroll.models.payslip import Payslip
from apps.payroll.models.salary_component_model import SalaryComponent, SalaryStructureComponent
from apps.payroll.models.salary_structure import SalaryStructure
from apps.payroll.models.tds_model import TDSSlab

class PayrollRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollRun
        fields = "__all__"

class PayslipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payslip
        fields = "__all__"

class SalaryComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryComponent
        fields = "__all__"

class SalaryStructureComponentSerializer(serializers.ModelSerializer):
    component = SalaryComponentSerializer(read_only=True)
    component_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = SalaryStructureComponent
        fields = ["id", "component", "component_id"]

class SalaryStructureSerializer(serializers.ModelSerializer):
    components = SalaryStructureComponentSerializer(many=True, read_only=True)
    
    class Meta:
        model = SalaryStructure
        fields = ["id", "name", "is_default", "is_active", "components", "created_at"]

class TDSSlabSerializer(serializers.ModelSerializer):
    class Meta:
        model = TDSSlab
        fields = "__all__"