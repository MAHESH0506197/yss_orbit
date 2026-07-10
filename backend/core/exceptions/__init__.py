# yss_orbit\backend\core\exceptions\__init__.py
from .base_exceptions import CoreBaseException, ApplicationError, ConfigurationError, RateLimitExceededException
from .authentication_exceptions import (
    InvalidCredentialsError, TokenExpiredError, TokenInvalidError,
    MissingTokenError, UserInactiveError, UserLockedError
)
from .authorization_exceptions import (
    InsufficientPermissionsError, RoleAccessDeniedError,
    ActionNotAllowedError, SubscriptionRequiredError
)
from .integration_exceptions import (
    IntegrationError, ExternalServiceTimeout,
    ExternalServiceUnavailable, WebhookDeliveryError
)
from .module_exceptions import (
    ModuleNotActiveError, ModuleConfigurationError, FeatureDisabledError
)
from .tenant_exceptions import (
    TenantNotFoundException, InvalidTenantError,
    TenantInactiveError, TenantResourceLimitExceeded,
    CrossTenantViolationException, TenantViolationException
)
from .validation_exceptions import (
    InvalidDataError, MissingRequiredFieldError,
    InvalidFormatError, ResourceAlreadyExistsError,
    UnprocessableEntityError, ValidationException
)
from .exception_handler import core_exception_handler

__all__ = [
    'CoreBaseException', 'ApplicationError', 'ConfigurationError', 'RateLimitExceededException',
    'InvalidCredentialsError', 'TokenExpiredError', 'TokenInvalidError',
    'MissingTokenError', 'UserInactiveError', 'UserLockedError',
    'InsufficientPermissionsError', 'RoleAccessDeniedError',
    'ActionNotAllowedError', 'SubscriptionRequiredError',
    'IntegrationError', 'ExternalServiceTimeout',
    'ExternalServiceUnavailable', 'WebhookDeliveryError',
    'ModuleNotActiveError', 'ModuleConfigurationError', 'FeatureDisabledError',
    'TenantNotFoundException', 'InvalidTenantError',
    'TenantInactiveError', 'TenantResourceLimitExceeded',
    'CrossTenantViolationException', 'TenantViolationException',
    'InvalidDataError', 'MissingRequiredFieldError',
    'InvalidFormatError', 'ResourceAlreadyExistsError',
    'UnprocessableEntityError', 'ValidationException',
    'core_exception_handler'
]
