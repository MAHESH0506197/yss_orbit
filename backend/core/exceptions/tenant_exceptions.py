# yss_orbit\backend\core\exceptions\tenant_exceptions.py
from .base_exceptions import ApplicationError, ConfigurationError

class TenantNotFoundException(ApplicationError):
    pass

class InvalidTenantError(ApplicationError):
    pass

class TenantInactiveError(ApplicationError):
    pass

class TenantResourceLimitExceeded(ApplicationError):
    pass

class CrossTenantViolationException(ApplicationError):
    pass

class TenantViolationException(ApplicationError):
    def __init__(self, message="Tenant violation", details=None):
        super().__init__(message)
        self.details = details
