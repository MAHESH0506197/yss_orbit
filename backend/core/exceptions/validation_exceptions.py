# yss_orbit\backend\core\exceptions\validation_exceptions.py
from rest_framework.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

class InvalidDataError(ValidationError):
    default_detail = _('Invalid data provided.')
    default_code = 'invalid_data'

class MissingRequiredFieldError(ValidationError):
    default_detail = _('A required field is missing.')
    default_code = 'missing_field'

class InvalidFormatError(ValidationError):
    default_detail = _('Data is in an invalid format.')
    default_code = 'invalid_format'

class ResourceAlreadyExistsError(ValidationError):
    default_detail = _('A resource with this identifier already exists.')
    default_code = 'resource_already_exists'

class UnprocessableEntityError(ValidationError):
    status_code = 422
    default_detail = _('The request was well-formed but was unable to be followed due to semantic errors.')
    default_code = 'unprocessable_entity'

class ValidationException(ValidationError):
    default_detail = _('Validation failed.')
    default_code = 'validation_failed'
