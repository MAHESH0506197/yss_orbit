# yss_orbit\backend\apps\reporting\serializers.py
from rest_framework import serializers
from .models import ReportTemplate, ReportExecution

class ReportTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportTemplate
        fields = [
            "id", "name", "description", "data_source", "query_config", 
            "is_scheduled", "cron_expression", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

class ReportExecutionSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source="template.name", read_only=True)
    
    class Meta:
        model = ReportExecution
        fields = [
            "id", "template", "template_name", "status", "started_at", "completed_at", 
            "error_message", "result_url", "row_count", "created_at"
        ]
        read_only_fields = ["id", "created_at", "started_at", "completed_at", "result_url", "row_count", "status", "error_message"]
