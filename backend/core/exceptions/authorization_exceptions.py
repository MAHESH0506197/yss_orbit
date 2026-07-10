# yss_orbit\backend\core\exceptions\authorization_exceptions.py
from rest_framework.exceptions import PermissionDenied
from django.utils.translation import gettext_lazy as _

class InsufficientPermissionsError(PermissionDenied):
    default_detail = _('You do not have permission to perform this action.')
    default_code = 'permission_denied'

class RoleAccessDeniedError(PermissionDenied):
    default_detail = _('Your role does not allow access to this resource.')
    default_code = 'role_access_denied'

class ActionNotAllowedError(PermissionDenied):
    default_detail = _('This action is not allowed for the current state of the resource.')
    default_code = 'action_not_allowed'

class SubscriptionRequiredError(PermissionDenied):
    default_detail = _('A specific subscription plan is required to access this feature.')
    default_code = 'subscription_required'
