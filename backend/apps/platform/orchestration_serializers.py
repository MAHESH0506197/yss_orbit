# yss_orbit\backend\apps\orchestration\serializers.py
from rest_framework import serializers
from apps.platform.models import Saga, SagaStep

class SagaStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = SagaStep
        fields = ["id", "step_name", "step_order", "status", "error_message", "result_payload", "created_at", "updated_at"]

class SagaSerializer(serializers.ModelSerializer):
    steps = SagaStepSerializer(many=True, read_only=True)

    class Meta:
        model = Saga
        fields = ["id", "saga_type", "status", "payload", "correlation_id", "business_unit_id", "created_at", "updated_at", "steps"]
