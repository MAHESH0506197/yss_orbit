# yss_orbit\backend\apps\error_log\api\views\error_log_list_view.py
from rest_framework.views import APIView
from rest_framework.response import Response

class ErrorLogListView(APIView):
    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})
