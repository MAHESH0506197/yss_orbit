# yss_orbit\backend\core\base\mixins.py
"""
Common mixins for models, views, and serializers.
"""
from django.db import models
import uuid
from django.utils.translation import gettext_lazy as _

class UUIDMixin(models.Model):
    """
    Replaces the default ID with a UUID field.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_("Unique identifier for this record.")
    )

    class Meta:
        abstract = True


class ActiveMixin(models.Model):
    """
    Adds an `is_active` boolean field.
    """
    is_active = models.BooleanField(
        _("active"),
        default=True,
        help_text=_("Designates whether this record should be treated as active.")
    )

    class Meta:
        abstract = True
