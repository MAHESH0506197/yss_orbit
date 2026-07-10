# yss_orbit\backend\apps\outbox\api\views\outbox_list_view.py
from rest_framework.views import APIView
from rest_framework.response import Response

class OutboxListView(APIView):
    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})
