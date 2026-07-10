from rest_framework import serializers
from apps.pqm.models.dropdown_option import PQMDropdownOption

class PQMDropdownOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PQMDropdownOption
        fields = [
            "id",
            "organization_id",
            "field_type",
            "name",
            "system_mapping",
            "display_order",
            "is_active",
            "created_at",
            "updated_at"
        ]
        read_only_fields = ["id", "organization_id", "created_at", "updated_at"]
