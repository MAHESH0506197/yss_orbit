# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\api\views\urls.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class Urls.PyAPIView(APIView):
    """
    API View for Urls.Py.
    """
    def get(self, request, *args, **kwargs):
        return Response({"message": "Urls.Py details retrieved"}, status=status.HTTP_200_OK)
