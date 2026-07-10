# yss_orbit\backend\apps\outbox\api\views\outbox_status_view.py
from rest_framework.views import APIView
from rest_framework.response import Response

class OutboxStatusView(APIView):
    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})
