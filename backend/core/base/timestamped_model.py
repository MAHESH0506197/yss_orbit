# yss_orbit\backend\core\base\timestamped_model.py
"""
Timestamped base model.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _

class TimestampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    ``created_at`` and ``updated_at`` fields.
    """
    created_at = models.DateTimeField(
        _("created at"),
        auto_now_add=True,
        help_text=_("Date and time when the record was created.")
    )
    updated_at = models.DateTimeField(
        _("updated at"),
        auto_now=True,
        help_text=_("Date and time when the record was last updated.")
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']
