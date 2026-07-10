# yss_orbit\backend\apps\outbox\api\views\dlq_view.py
from rest_framework.views import APIView
from rest_framework.response import Response

class DlqView(APIView):
    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})
