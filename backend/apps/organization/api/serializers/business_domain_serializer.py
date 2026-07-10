import logging
from rest_framework import serializers
from apps.organization.models import BusinessDomain

logger = logging.getLogger(__name__)

class BusinessDomainSerializer(serializers.ModelSerializer):
    organizations_count = serializers.IntegerField(read_only=True, default=0)
    business_units_count = serializers.IntegerField(read_only=True, default=0)
    active_users_count = serializers.SerializerMethodField()

    class Meta:
        model = BusinessDomain
        fields = [
            "id", "name", "code", "description", "logo_url", "is_active", 
            "created_at", "updated_at", "is_deleted", "deleted_at", 
            "created_by_id", "updated_by_id", "deleted_by_id", 
            "restored_at", "restored_by_id",
            "created_reason", "updated_reason", "deleted_reason", "restored_reason",
            "organizations_count", "business_units_count", "active_users_count",
            "reason"
        ]
        read_only_fields = [
            "id", "created_at", "updated_at", "deleted_at", 
            "created_by_id", "updated_by_id", "deleted_by_id",
            "restored_at", "restored_by_id",
            "deleted_reason", "restored_reason"
        ]

    reason = serializers.CharField(write_only=True, required=False, allow_blank=True)

    def get_active_users_count(self, obj) -> int:
        """
        ISSUE-02: Returns annotated value if the viewset already annotated it (zero extra queries),
        otherwise falls back to the 2-query implementation.
        The view annotates `active_users_count` via Subquery for list endpoints.
        """
        if hasattr(obj, "active_users_count") and obj.active_users_count is not None:
            return obj.active_users_count
        try:
            from apps.organization.models import BusinessUnit
            from apps.organization.models.user_business_unit_model import UserBusinessUnitModel
            bu_ids = BusinessUnit.objects.filter(
                organization__business_domain=obj,
                is_deleted=False,
            ).values_list("id", flat=True)
            if not bu_ids:
                return 0
            return (
                UserBusinessUnitModel.objects.filter(
                    business_unit_id__in=bu_ids,
                    is_deleted=False,
                    is_active_membership=True,
                )
                .values("user_id")
                .distinct()
                .count()
            )
        except Exception as e:
            logger.error("Error counting active users for BD %s: %s", obj.id, e)
            return 0

    def validate_code(self, value):
        if value:
            value = str(value).upper()
            if not value.startswith("BDOM-"):
                raise serializers.ValidationError("Code must start with 'BDOM-'.")
            if len(value) > 20:
                raise serializers.ValidationError("Code cannot exceed 20 characters.")
        return value

# LOW-01 FIX: BusinessDomainCreateUpdateSerializer was an empty pass-through subclass.
# The view uses BusinessDomainSerializer directly for both read and write — this class
# was dead code. Removed.

class BusinessDomainListSerializer(BusinessDomainSerializer):
    class Meta:
        model = BusinessDomain
        fields = [
            "id", "name", "code", "description", "is_active", "logo_url",
            "is_deleted", "created_at", "updated_at",
            "organizations_count", "business_units_count", "active_users_count"
        ]
