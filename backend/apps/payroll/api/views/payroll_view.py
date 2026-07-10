from rest_framework import views, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.core.exceptions import ObjectDoesNotExist

from apps.payroll.models import PayrollRun, Payslip, SalaryComponent, SalaryStructure, TDSSlab
from apps.payroll.api.serializers.payroll_serializer import (
    PayrollRunSerializer, PayslipSerializer, SalaryComponentSerializer,
    SalaryStructureSerializer, TDSSlabSerializer
)
from apps.payroll.services.payroll_service import PayrollService

class SalaryComponentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SalaryComponentSerializer
    
    def get_queryset(self):
        return SalaryComponent.objects.filter(business_unit_id=self.request.security_context.require_business_unit())
        
    def perform_create(self, serializer):
        serializer.save(business_unit_id=self.request.security_context.require_business_unit())

class SalaryStructureViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SalaryStructureSerializer
    
    def get_queryset(self):
        return SalaryStructure.objects.filter(business_unit_id=self.request.security_context.require_business_unit())
        
    def perform_create(self, serializer):
        serializer.save(business_unit_id=self.request.security_context.require_business_unit())

class PayrollRunViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PayrollRunSerializer
    
    def get_queryset(self):
        return PayrollRun.objects.filter(business_unit_id=self.request.security_context.require_business_unit()).order_by('-year', '-month')

    @action(detail=False, methods=['post'])
    def generate(self, request):
        bu_id = request.security_context.require_business_unit()
        month = request.data.get('month')
        year = request.data.get('year')
        
        if not month or not year:
            return Response({"error": "Month and Year required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            run = PayrollService.generate_monthly_payroll(
                tenant_id=bu_id,
                month=int(month),
                year=int(year),
                run_by_id=request.security_context.effective_user_id
            )
            return Response(PayrollRunSerializer(run).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PayslipViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PayslipSerializer

    def get_queryset(self):
        bu_id = self.request.security_context.require_business_unit()
        run_id = self.request.query_params.get('run_id')
        my_payslips = self.request.query_params.get('my_payslips')

        qs = Payslip.objects.filter(business_unit_id=bu_id).order_by('-year', '-month')

        if run_id:
            qs = qs.filter(payroll_run_id=run_id)

        if my_payslips == 'true':
            # TENANT ISOLATION: effective_user_id is the User UUID, not the Employee UUID.
            # Must look up the Employee record for this BU first — never compare user_id to employee_id.
            from apps.hrms.models import Employee
            try:
                employee = Employee.objects.get(
                    business_unit_id=bu_id,
                    user_id=self.request.security_context.effective_user_id,
                )
                qs = qs.filter(employee_id=employee.id)
            except Employee.DoesNotExist:
                # This user has no employee profile in this BU — return empty queryset
                qs = qs.none()

        return qs