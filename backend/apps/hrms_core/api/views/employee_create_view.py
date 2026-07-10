# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\api\views\employee_create_view.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class EmployeeCreateAPIView(APIView):
    """
    API View for EmployeeCreate.
    """
    def get(self, request, *args, **kwargs):
        return Response({"message": "EmployeeCreate details retrieved"}, status=status.HTTP_200_OK)
