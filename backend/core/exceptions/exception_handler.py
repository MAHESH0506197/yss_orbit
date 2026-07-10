# yss_orbit\backend\core\exceptions\exception_handler.py
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def core_exception_handler(exc, context):
    """
    Custom exception handler for Django Rest Framework that provides standard error formats.
    """
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Now add the HTTP status code to the response.
    if response is not None:
        custom_response_data = {
            'error': {
                'status_code': response.status_code,
                'default_code': getattr(exc, 'default_code', 'error'),
                'detail': response.data.get('detail', response.data) if isinstance(response.data, dict) else response.data,
            }
        }
        
        # If there are validation errors, include them in a structured format
        if isinstance(response.data, dict) and 'detail' not in response.data:
             custom_response_data['error']['validation_errors'] = response.data
             custom_response_data['error']['detail'] = 'Validation failed.'
             custom_response_data['error']['default_code'] = 'validation_error'

        response.data = custom_response_data
    else:
        # Unhandled exceptions (e.g. 500 Internal Server Error)
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return Response({
            'error': {
                'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                'default_code': 'internal_server_error',
                'detail': 'An unexpected error occurred.'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
