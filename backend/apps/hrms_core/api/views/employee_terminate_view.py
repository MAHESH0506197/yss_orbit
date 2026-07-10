# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\api\views\employee_terminate_view.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class EmployeeTerminateAPIView(APIView):
    """
    API View for EmployeeTerminate.
    """
    def get(self, request, *args, **kwargs):
        return Response({"message": "EmployeeTerminate details retrieved"}, status=status.HTTP_200_OK)
