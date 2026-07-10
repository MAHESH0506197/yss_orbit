from rest_framework import serializers
from apps.platform.models import BackgroundJob

class BackgroundJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackgroundJob
        fields = [
            "id", "celery_task_id", "job_type", "name", "business_unit_id",
            "triggered_by_id", "status", "progress_percent", "progress_message",
            "result_data", "error_message", "correlation_id",
            "created_at", "started_at", "completed_at", "expires_at",
        ]
        read_only_fields = fields
