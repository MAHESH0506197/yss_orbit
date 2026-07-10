import os

base_dir = r"C:\PROJECT\yss_orbit\backend\apps"

# error_log model
error_log_dir = os.path.join(base_dir, 'error_log', 'models')
os.makedirs(error_log_dir, exist_ok=True)
with open(os.path.join(error_log_dir, '__init__.py'), 'w') as f:
    f.write("""from django.db import models
from core.base.tenant_model import TenantModel

class ErrorLog(TenantModel):
    message = models.TextField()
    exception_type = models.CharField(max_length=255)
    endpoint = models.CharField(max_length=255)
    correlation_id = models.CharField(max_length=255, null=True, blank=True)
    severity = models.CharField(max_length=50)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    user_id = models.CharField(max_length=255, null=True, blank=True)
    organization_id = models.CharField(max_length=255, null=True, blank=True)
    class Meta:
        db_table = 'error_logs'
""")

# api_consumer_key model
api_consumer_key_dir = os.path.join(base_dir, 'api_consumer_key', 'models')
os.makedirs(api_consumer_key_dir, exist_ok=True)
with open(os.path.join(api_consumer_key_dir, '__init__.py'), 'w') as f:
    f.write("""from django.db import models
from core.base.tenant_model import TenantModel

class ApiConsumerKey(TenantModel):
    name = models.CharField(max_length=255)
    key = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    last_used = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = 'api_consumer_keys'
""")

# feature_flags model
feature_flags_dir = os.path.join(base_dir, 'feature_flags', 'models')
os.makedirs(feature_flags_dir, exist_ok=True)
with open(os.path.join(feature_flags_dir, '__init__.py'), 'w') as f:
    f.write("""from django.db import models
from core.base.tenant_model import TenantModel

class FeatureFlag(TenantModel):
    name = models.CharField(max_length=255)
    key = models.CharField(max_length=255, unique=True)
    is_enabled = models.BooleanField(default=False)
    class Meta:
        db_table = 'feature_flags'
""")

# integration model
integration_dir = os.path.join(base_dir, 'integration', 'models')
os.makedirs(integration_dir, exist_ok=True)
with open(os.path.join(integration_dir, '__init__.py'), 'w') as f:
    f.write("""from django.db import models
from core.base.tenant_model import TenantModel

class Integration(TenantModel):
    name = models.CharField(max_length=255)
    provider = models.CharField(max_length=255)
    is_active = models.BooleanField(default=False)
    config = models.JSONField(default=dict)
    class Meta:
        db_table = 'integrations'
""")

# jobs model
jobs_dir = os.path.join(base_dir, 'jobs', 'models')
os.makedirs(jobs_dir, exist_ok=True)
with open(os.path.join(jobs_dir, '__init__.py'), 'w') as f:
    f.write("""from django.db import models
from core.base.tenant_model import TenantModel

class BackgroundJob(TenantModel):
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=50)
    result = models.TextField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = 'background_jobs'
""")

# webhook model
webhook_dir = os.path.join(base_dir, 'webhook', 'models')
os.makedirs(webhook_dir, exist_ok=True)
with open(os.path.join(webhook_dir, '__init__.py'), 'w') as f:
    f.write("""from django.db import models
from core.base.tenant_model import TenantModel

class WebhookEndpoint(TenantModel):
    url = models.URLField()
    secret = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    class Meta:
        db_table = 'webhook_endpoints'

class WebhookDelivery(TenantModel):
    endpoint = models.ForeignKey(WebhookEndpoint, on_delete=models.CASCADE)
    event_type = models.CharField(max_length=255)
    payload = models.JSONField(default=dict)
    status = models.CharField(max_length=50)
    response_code = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = 'webhook_deliveries'
""")

print("Created models successfully.")
