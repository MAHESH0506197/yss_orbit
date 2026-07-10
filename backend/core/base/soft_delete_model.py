# yss_orbit\backend\core\base\soft_delete_model.py
"""
Soft delete model and manager.
"""
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from core.base.timestamped_model import TimestampedModel


class SoftDeleteQuerySet(models.QuerySet):
    """
    QuerySet that automatically filters out soft-deleted records.
    """
    def delete(self):
        """Soft delete records in the queryset."""
        return super().update(is_deleted=True, deleted_at=timezone.now())

    def hard_delete(self):
        """Permanently delete records in the queryset."""
        return super().delete()
        
    def active(self):
        """Return only active (non-deleted) records."""
        return self.filter(is_deleted=False)

    def deleted(self):
        """Return only soft-deleted records."""
        return self.filter(is_deleted=True)


class SoftDeleteManager(models.Manager):
    """
    Manager that uses SoftDeleteQuerySet.
    """
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)

    def all_with_deleted(self):
        """Return all records including soft-deleted ones."""
        return SoftDeleteQuerySet(self.model, using=self._db)
        
    def deleted(self):
        """Return only soft-deleted records."""
        return self.all_with_deleted().filter(is_deleted=True)


class SoftDeleteModel(TimestampedModel):
    """
    An abstract base class model that provides soft delete capabilities.
    """
    is_deleted = models.BooleanField(
        _("is deleted"),
        default=False,
        help_text=_("Indicates whether the record has been soft-deleted.")
    )
    deleted_at = models.DateTimeField(
        _("deleted at"),
        null=True,
        blank=True,
        help_text=_("Date and time when the record was soft-deleted.")
    )
    
    # Custom managers
    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        """
        Soft delete the record.
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(using=using, update_fields=['is_deleted', 'deleted_at', 'updated_at'])

    def hard_delete(self, using=None, keep_parents=False):
        """
        Permanently delete the record.
        """
        super().delete(using=using, keep_parents=keep_parents)
        
    def restore(self):
        """
        Restore a soft-deleted record.
        """
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'updated_at'])
