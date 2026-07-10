from django.db import models
from core.base.tenant_model import TenantModel

class Integration(TenantModel):
    class Provider(models.TextChoices):
        SLACK = 'slack', 'Slack'
        STRIPE = 'stripe', 'Stripe'
        GITHUB = 'github', 'GitHub'
        CUSTOM = 'custom', 'Custom'

    name = models.CharField(max_length=255)
    provider = models.CharField(max_length=50, choices=Provider.choices, default=Provider.CUSTOM)
    is_active = models.BooleanField(default=False)
    credentials = models.JSONField(default=dict, blank=True)
    settings = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'integrations'

    def __str__(self):
        return f"{self.provider} - {self.name}"
