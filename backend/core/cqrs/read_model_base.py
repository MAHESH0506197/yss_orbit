# yss_orbit\backend\core\cqrs\read_model_base.py
from django.db import models

class ReadModelBase(models.Model):
    """
    Base abstract class for all Read Models in the CQRS architecture.
    Read Models should be highly optimized for querying and are generally 
    updated asynchronously via projections from domain events.
    """
    # Track when the read model was last updated
    last_updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
        
    def save(self, *args, **kwargs):
        """
        Overrides save to enforce that read models should typically only be 
        saved by projections, not directly mutated by business logic.
        """
        super().save(*args, **kwargs)
