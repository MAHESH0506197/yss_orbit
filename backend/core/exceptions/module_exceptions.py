# yss_orbit\backend\core\exceptions\module_exceptions.py
from .base_exceptions import ApplicationError, ConfigurationError

class ModuleNotActiveError(ApplicationError):
    pass

class ModuleConfigurationError(ConfigurationError):
    pass

class FeatureDisabledError(ApplicationError):
    pass
