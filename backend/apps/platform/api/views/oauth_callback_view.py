# yss_orbit\backend\apps\integration\api\views\oauth_callback_view.py
from rest_framework.views import APIView
from rest_framework.response import Response

class OauthCallbackView(APIView):
    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})
