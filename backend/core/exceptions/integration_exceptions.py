# yss_orbit\backend\core\exceptions\integration_exceptions.py
from core.exceptions.base_exceptions import CoreBaseException
from django.utils.translation import gettext_lazy as _
from rest_framework import status

class IntegrationError(CoreBaseException):
    """Base exception for all third-party integration errors."""
    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = _('An error occurred while communicating with an external service.')
    default_code = 'integration_error'

class ExternalServiceTimeout(IntegrationError):
    status_code = status.HTTP_504_GATEWAY_TIMEOUT
    default_detail = _('The external service did not respond in time.')
    default_code = 'external_service_timeout'

class ExternalServiceUnavailable(IntegrationError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = _('The external service is currently unavailable.')
    default_code = 'external_service_unavailable'

class WebhookDeliveryError(IntegrationError):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = _('Failed to deliver webhook payload.')
    default_code = 'webhook_delivery_error'
