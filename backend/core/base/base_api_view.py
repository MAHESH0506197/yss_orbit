# yss_orbit\backend\core\base\base_api_view.py
"""
Base API View implementation.
"""
from rest_framework.views import APIView
from core.responses import SuccessResponse, ErrorResponse

class BaseAPIView(APIView):
    """
    Base API View that provides common functionality for all API views.
    """
    
    def success_response(self, data=None, message="Success", status_code=200):
        """Return a standardized success response."""
        return SuccessResponse(data=data, message=message, status_code=status_code)

    def error_response(self, message="Error", status_code=400, errors=None):
        """Return a standardized error response."""
        return ErrorResponse(message=message, status_code=status_code, errors=errors)
