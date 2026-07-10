from rest_framework import serializers
from apps.platform.models import FeatureFlag

class FeatureFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureFlag
        fields = [
            "id", "code", "name", "description",
            "is_enabled_globally", "rollout_percentage",
            "allowed_organizations", "allowed_plans",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
