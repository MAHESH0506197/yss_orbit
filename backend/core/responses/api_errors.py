# yss_orbit\backend\core\responses\api_errors.py
from rest_framework.exceptions import APIException
from rest_framework import status
from .response_codes import ResponseCode


class BaseAPIException(APIException):
    """
    Base API Exception that other custom exceptions can inherit from.
    Integrates with standard DRF exception handling while providing
    custom codes and errors structure.
    """
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'An unexpected error occurred.'
    default_code = ResponseCode.INTERNAL_SERVER_ERROR
    
    def __init__(self, detail=None, code=None, errors=None):
        super().__init__(detail, code)
        self.errors = errors
        if code:
            self.code = code
        else:
            self.code = self.default_code


class ResourceNotFoundException(BaseAPIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'The requested resource was not found.'
    default_code = ResponseCode.NOT_FOUND


class ValidationException(BaseAPIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid input provided.'
    default_code = ResponseCode.VALIDATION_ERROR


class UnauthorizedException(BaseAPIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication is required and has failed or has not yet been provided.'
    default_code = ResponseCode.UNAUTHORIZED


class ForbiddenException(BaseAPIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = ResponseCode.FORBIDDEN


class ConflictException(BaseAPIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'A conflict occurred with the current state of the resource.'
    default_code = ResponseCode.CONFLICT


class ServiceUnavailableException(BaseAPIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'The server is currently unable to handle the request.'
    default_code = ResponseCode.SERVICE_UNAVAILABLE
