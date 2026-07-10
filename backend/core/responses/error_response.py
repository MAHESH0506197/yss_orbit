# yss_orbit\backend\core\responses\error_response.py
from rest_framework import status
from .api_response import StandardAPIResponse
from .response_codes import ResponseCode


class ErrorResponse(StandardAPIResponse):
    """
    Standard error response (HTTP 400).
    """
    def __init__(
        self,
        message="An error occurred.",
        code=ResponseCode.BAD_REQUEST,
        status_code=status.HTTP_400_BAD_REQUEST,
        errors=None,
        headers=None,
        **kwargs
    ):
        super().__init__(
            success=False,
            status_code=status_code,
            code=code,
            message=message,
            errors=errors,
            headers=headers,
            **kwargs
        )


class ValidationErrorResponse(ErrorResponse):
    """
    Standard validation error response (HTTP 400).
    """
    def __init__(self, errors=None, message="Validation failed.", headers=None, **kwargs):
        super().__init__(
            message=message,
            code=ResponseCode.VALIDATION_ERROR,
            status_code=status.HTTP_400_BAD_REQUEST,
            errors=errors,
            headers=headers,
            **kwargs
        )


class NotFoundResponse(ErrorResponse):
    """
    Standard not found response (HTTP 404).
    """
    def __init__(self, message="Resource not found.", errors=None, headers=None, **kwargs):
        super().__init__(
            message=message,
            code=ResponseCode.NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND,
            errors=errors,
            headers=headers,
            **kwargs
        )


class UnauthorizedResponse(ErrorResponse):
    """
    Standard unauthorized response (HTTP 401).
    """
    def __init__(self, message="Authentication credentials were not provided or are invalid.", errors=None, headers=None, **kwargs):
        super().__init__(
            message=message,
            code=ResponseCode.UNAUTHORIZED,
            status_code=status.HTTP_401_UNAUTHORIZED,
            errors=errors,
            headers=headers,
            **kwargs
        )


class ForbiddenResponse(ErrorResponse):
    """
    Standard forbidden response (HTTP 403).
    """
    def __init__(self, message="You do not have permission to perform this action.", errors=None, headers=None, **kwargs):
        super().__init__(
            message=message,
            code=ResponseCode.FORBIDDEN,
            status_code=status.HTTP_403_FORBIDDEN,
            errors=errors,
            headers=headers,
            **kwargs
        )


class InternalServerErrorResponse(ErrorResponse):
    """
    Standard internal server error response (HTTP 500).
    """
    def __init__(self, message="An unexpected error occurred on the server.", errors=None, headers=None, **kwargs):
        super().__init__(
            message=message,
            code=ResponseCode.INTERNAL_SERVER_ERROR,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            errors=errors,
            headers=headers,
            **kwargs
        )
