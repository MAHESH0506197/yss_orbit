# yss_orbit\backend\apps\error_log\api\views\error_detail_view.py
from rest_framework.views import APIView
from rest_framework.response import Response

class ErrorDetailView(APIView):
    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})
