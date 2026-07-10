# yss_orbit\backend\core\exceptions\authentication_exceptions.py
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated
from django.utils.translation import gettext_lazy as _

class InvalidCredentialsError(AuthenticationFailed):
    default_detail = _('Invalid authentication credentials provided.')
    default_code = 'invalid_credentials'

class TokenExpiredError(AuthenticationFailed):
    default_detail = _('The authentication token has expired.')
    default_code = 'token_expired'

class TokenInvalidError(AuthenticationFailed):
    default_detail = _('The authentication token is invalid.')
    default_code = 'token_invalid'

class MissingTokenError(NotAuthenticated):
    default_detail = _('Authentication credentials were not provided.')
    default_code = 'not_authenticated'

class UserInactiveError(AuthenticationFailed):
    default_detail = _('This account is inactive.')
    default_code = 'user_inactive'

class UserLockedError(AuthenticationFailed):
    default_detail = _('This account has been locked due to too many failed login attempts.')
    default_code = 'user_locked'
