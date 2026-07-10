# yss_orbit\backend\core\responses\response_builder.py
from .success_response import SuccessResponse, CreatedResponse, NoContentResponse
from .error_response import (
    ErrorResponse, ValidationErrorResponse, NotFoundResponse, 
    UnauthorizedResponse, ForbiddenResponse, InternalServerErrorResponse
)


class ResponseBuilder:
    """
    A utility factory class to construct standard API responses concisely.
    Useful for class-based or function-based views to return consistent formats.
    """
    
    @staticmethod
    def success(data=None, message="Operation completed successfully.", meta=None, headers=None, **kwargs):
        return SuccessResponse(data=data, message=message, meta=meta, headers=headers, **kwargs)

    @staticmethod
    def created(data=None, message="Resource created successfully.", meta=None, headers=None, **kwargs):
        return CreatedResponse(data=data, message=message, meta=meta, headers=headers, **kwargs)

    @staticmethod
    def no_content(message="No content.", headers=None, **kwargs):
        return NoContentResponse(message=message, headers=headers, **kwargs)

    @staticmethod
    def error(message="An error occurred.", code=None, status_code=None, errors=None, headers=None, **kwargs):
        kwargs_to_pass = {}
        if code: 
            kwargs_to_pass['code'] = code
        if status_code: 
            kwargs_to_pass['status_code'] = status_code
        
        return ErrorResponse(
            message=message, 
            errors=errors, 
            headers=headers,
            **kwargs_to_pass, 
            **kwargs
        )
        
    @staticmethod
    def validation_error(errors=None, message="Validation failed.", headers=None, **kwargs):
        return ValidationErrorResponse(errors=errors, message=message, headers=headers, **kwargs)

    @staticmethod
    def not_found(message="Resource not found.", errors=None, headers=None, **kwargs):
        return NotFoundResponse(message=message, errors=errors, headers=headers, **kwargs)

    @staticmethod
    def unauthorized(message="Authentication credentials were not provided or are invalid.", errors=None, headers=None, **kwargs):
        return UnauthorizedResponse(message=message, errors=errors, headers=headers, **kwargs)

    @staticmethod
    def forbidden(message="You do not have permission to perform this action.", errors=None, headers=None, **kwargs):
        return ForbiddenResponse(message=message, errors=errors, headers=headers, **kwargs)

    @staticmethod
    def internal_error(message="An unexpected error occurred on the server.", errors=None, headers=None, **kwargs):
        return InternalServerErrorResponse(message=message, errors=errors, headers=headers, **kwargs)
