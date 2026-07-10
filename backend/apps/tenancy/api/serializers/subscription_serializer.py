from __future__ import annotations

from rest_framework import serializers

from apps.tenancy.models import PlatformModule, SubscriptionPlan, BusinessUnitSubscription


class PlatformModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformModule
        fields = [
            "id", "code", "name", "description", "category",
            "icon", "is_free", "sort_order", "is_active", "created_at",
            "created_reason", "updated_reason", "deleted_reason", "restored_reason",
            "reason"
        ]
        read_only_fields = [
            "id", "created_at",
            "created_reason", "updated_reason", "deleted_reason", "restored_reason"
        ]

    reason = serializers.CharField(write_only=True, required=False, allow_blank=True)


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    modules = PlatformModuleSerializer(many=True, read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = [
            "id", "code", "name", "description",
            "price_monthly", "price_yearly", "currency",
            "max_users", "max_business_units", "max_products",
            "max_api_calls_per_day", "max_storage_gb",
            "modules",
            "is_featured", "sort_order", "is_active", "created_at"
        ]


class BusinessUnitSubscriptionSerializer(serializers.ModelSerializer):
    plan_details = SubscriptionPlanSerializer(source="plan", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = BusinessUnitSubscription
        fields = [
            "id", "business_unit_id", "plan", "plan_details",
            "status", "status_display", "billing_cycle",
            "amount", "currency", "trial_ends_at",
            "started_at", "current_period_start",
            "current_period_end", "cancelled_at", "expires_at",
            "created_at", "updated_at"
        ]
        read_only_fields = [
            "id", "started_at", "created_at", "updated_at",
            "status", "cancelled_at", "expires_at"
        ]
