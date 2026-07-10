# yss_orbit/backend/apps/payroll/api/v1/views.py
from rest_framework import views, status, serializers
from rest_framework.response import Response
from apps.payroll.services.payroll_service import PayrollService

class GeneratePayrollSerializer(serializers.Serializer):
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2000)

class GeneratePayrollView(views.APIView):
    def post(self, request):
        serializer = GeneratePayrollSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            run = PayrollService.generate_monthly_payroll(
                tenant_id=request.business_unit_id,
                month=serializer.validated_data["month"],
                year=serializer.validated_data["year"]
            )
            return Response({"id": run.id, "status": run.status}, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
