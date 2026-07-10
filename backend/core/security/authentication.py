# yss_orbit\backend\core\security\authentication.py
from rest_framework.authentication import BaseAuthentication

class YSSJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        return None