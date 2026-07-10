# yss_orbit\backend\core\constants.py
"""
Core constants.
"""
# Standard System Actor IDs
SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000"
SYSTEM_TENANT_ID = "00000000-0000-0000-0000-000000000000"

# Standard Timeouts
DEFAULT_CACHE_TIMEOUT = 300
LONG_CACHE_TIMEOUT = 86400

# Headers
TENANT_HEADER = "X-Business-Unit-Id"
CORRELATION_HEADER = "X-Correlation-Id"
REQUEST_ID_HEADER = "X-Request-Id"
