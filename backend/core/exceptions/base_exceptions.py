# yss_orbit\backend\core\exceptions\base_exceptions.py
from rest_framework.exceptions import APIException
from django.utils.translation import gettext_lazy as _

class CoreBaseException(APIException):
    """
    Base exception class for all custom exceptions in the application.
    Subclasses should define `status_code`, `default_detail`, and `default_code`.
    """
    status_code = 500
    default_detail = _('A server error occurred.')
    default_code = 'error'

class ApplicationError(CoreBaseException):
    """
    Exception raised for generic application errors.
    """
    status_code = 400
    default_detail = _('An application error occurred.')
    default_code = 'application_error'

class ConfigurationError(CoreBaseException):
    """
    Exception raised when there is a misconfiguration in the system.
    """
    status_code = 500
    default_detail = _('System configuration error.')
    default_code = 'configuration_error'

class RateLimitExceededException(CoreBaseException):
    """
    Exception raised when the rate limit for an API or tenant is exceeded.
    """
    status_code = 429
    default_detail = _('Request limit exceeded. Please try again later.')
    default_code = 'throttled'
