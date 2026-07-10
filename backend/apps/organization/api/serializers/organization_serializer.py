# yss_orbit/backend/apps/organization/api/serializers/organization_serializer.py
"""
YSS Orbit — Organization Serializers

ENTERPRISE AUDIT CHANGES:
  ✅ Removed `slug` from all serializers (field removed from model)
  ✅ Added `restored_at`, `restored_by_id` to full + list serializers
  ✅ Added `business_domain_name` (method field) to list + full serializers
  ✅ Added `deleted_at`, `deleted_by_id` to OrganizationListSerializer
  ✅ Removed `validate_slug` (no more slug on model)
  ✅ validate_owner_id now allows owner assignment on create (no more hard block)
  ✅ Fixed email coercion to align with model (blank=True default="")
  ✅ Removed slug uniqueness check from validate()
  ✅ SLUG_REGEX import removed (slug no longer used)
"""
from __future__ import annotations

from rest_framework import serializers

from apps.organization.models import Organization, OrganizationSettings, BusinessDomain


# ─── Settings Serializer ──────────────────────────────────────────────────────
class OrganizationSettingsSerializer(serializers.ModelSerializer):
    custom_domain = serializers.SerializerMethodField()
    domain_status = serializers.SerializerMethodField()
    ssl_status    = serializers.SerializerMethodField()

    class Meta:
        model  = OrganizationSettings
        exclude = ["organization"]
        read_only_fields = ["id", "created_at", "updated_at", "domain_status", "ssl_status"]

    # PERF-03 FIX: Cache BrandConfiguration lookup so the 3 SerializerMethodFields
    # (custom_domain, domain_status, ssl_status) issue only ONE query instead of THREE.
    def _get_brand_config(self, obj):
        """Return the org-level BrandConfiguration (no BU), cached per serialization."""
        if not hasattr(obj, "_cached_brand_config"):
            try:
                from apps.platform.models import BrandConfiguration
                brand = BrandConfiguration.objects.filter(
                    organization_id=obj.organization_id,
                    business_unit__isnull=True,
                ).first()
            except Exception:
                brand = None
            object.__setattr__(obj, "_cached_brand_config", brand)
        return obj._cached_brand_config

    def get_custom_domain(self, obj):
        brand = self._get_brand_config(obj)
        return brand.custom_domain if brand else None

    def get_domain_status(self, obj):
        brand = self._get_brand_config(obj)
        return brand.domain_status if brand else "pending"

    def get_ssl_status(self, obj):
        brand = self._get_brand_config(obj)
        return brand.ssl_status if brand else "pending"

    def validate_session_timeout_minutes(self, value: int) -> int:
        if not (5 <= value <= 1440):
            raise serializers.ValidationError(
                "session_timeout_minutes must be between 5 and 1440 (24 hours)."
            )
        return value

    def validate_max_users(self, value):
        if value is not None and value < 1:
            raise serializers.ValidationError("max_users must be a positive integer or null.")
        return value

    def update(self, instance, validated_data):
        request = self.context.get("request")
        data = request.data if request else {}

        # Intercept custom_domain and branding changes → update BrandConfiguration
        brand_keys = ["custom_domain", "domain_status", "ssl_status"]
        if any(k in data for k in brand_keys):
            try:
                from apps.platform.models import BrandConfiguration
                brand, _ = BrandConfiguration.objects.get_or_create(
                    organization_id=instance.organization_id,
                    business_unit__isnull=True,
                )
                fields_to_update = []
                if "custom_domain" in data:
                    new_domain = data["custom_domain"] or None
                    if brand.custom_domain != new_domain:
                        brand.custom_domain = new_domain
                        brand.domain_status = "pending"
                        brand.ssl_status    = "pending"
                        fields_to_update.extend(["custom_domain", "domain_status", "ssl_status"])
                if "domain_status" in data:
                    brand.domain_status = data["domain_status"]
                    fields_to_update.append("domain_status")
                if "ssl_status" in data:
                    brand.ssl_status = data["ssl_status"]
                    fields_to_update.append("ssl_status")
                
                if fields_to_update:
                    brand.save(update_fields=list(set(fields_to_update)))
            except Exception:
                pass

        return super().update(instance, validated_data)


# ─── Full Read Serializer (single-object retrieve) ────────────────────────────
class OrganizationSerializer(serializers.ModelSerializer):
    """Full representation for single-object reads. Includes nested settings."""
    settings             = OrganizationSettingsSerializer(read_only=True)
    business_units_count = serializers.IntegerField(read_only=True, default=0)
    owner_name           = serializers.SerializerMethodField()
    business_domain_name = serializers.SerializerMethodField()
    reason               = serializers.CharField(write_only=True, required=False, allow_blank=True)

    def get_owner_name(self, obj: Organization) -> str | None:
        if not obj.owner_id:
            return None
        try:
            from apps.iam.models.user import User
            user = User.objects.only("first_name", "last_name").get(id=obj.owner_id)
            return f"{user.first_name} {user.last_name}".strip() or "Unknown User"
        except Exception:
            return None

    def get_business_domain_name(self, obj: Organization) -> str | None:
        try:
            return obj.business_domain.name if obj.business_domain_id else None
        except Exception:
            return None

    class Meta:
        model  = Organization
        fields = [
            # System (PlatformModel / BaseModel)
            "id", "is_active", "is_deleted", "deleted_at", "deleted_by_id",
            "created_at", "updated_at", "created_by_id", "updated_by_id",
            "created_reason", "updated_reason", "deleted_reason",
            # Restore audit
            "restored_at", "restored_by_id", "restored_reason",
            # Identity
            "name", "logo_url",
            # Platform contact
            "email", "phone",
            # HQ Address
            "headquarters_address_1", "headquarters_address_2",
            "city", "state", "country", "postal_code",
            # Locale defaults
            "timezone", "currency_code",
            # Loose FKs
            "owner_id", "owner_name",
            # Business Domain
            "business_domain_id", "business_domain_name",
            # Nested
            "settings",
            # Write-only audit
            "reason",
            # Annotations
            "business_units_count",
        ]
        read_only_fields = [
            "id", "is_deleted", "deleted_at", "deleted_by_id",
            "created_at", "updated_at", "created_by_id", "updated_by_id",
            "created_reason", "updated_reason", "deleted_reason",
            "restored_at", "restored_by_id", "restored_reason",
        ]


# ─── List Serializer (lightweight, no nested settings) ────────────────────────
class OrganizationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list endpoints. No nested relations."""
    business_units_count = serializers.IntegerField(read_only=True, default=0)
    business_domain_name = serializers.SerializerMethodField()

    def get_business_domain_name(self, obj: Organization) -> str | None:
        try:
            return obj.business_domain.name if obj.business_domain_id else None
        except Exception:
            return None

    class Meta:
        model  = Organization
        fields = [
            "id", "name", "logo_url",
            "email", "phone",
            "city", "state", "country",
            "timezone", "currency_code",
            "is_active", "is_deleted",
            "deleted_at", "deleted_by_id", "deleted_reason",
            "restored_at", "restored_by_id", "restored_reason",
            "created_at", "updated_at", "created_reason", "updated_reason",
            "business_domain_id", "business_domain_name",
            "owner_id",
            "business_units_count",
        ]


# ─── Write Serializer (create / update) ──────────────────────────────────────
class OrganizationCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for create / partial_update operations.
    Slug removed from model — no slug validation needed.
    """
    business_domain_id = serializers.PrimaryKeyRelatedField(
        source="business_domain",
        queryset=BusinessDomain.objects.filter(is_deleted=False),
        required=True,
    )

    class Meta:
        model  = Organization
        fields = [
            "name", "logo_url",
            "email", "phone",
            "headquarters_address_1", "headquarters_address_2",
            "city", "state", "country", "postal_code",
            "timezone", "currency_code",
            "is_active", "owner_id", "business_domain_id",
            "reason",
        ]

    reason = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # ── Field validators ──────────────────────────────────────────────────────
    def validate_name(self, value: str) -> str:
        return value.strip()

    def validate_business_domain_id(self, value):
        if self.instance and self.instance.business_domain_id != value.id:
            if self.instance.business_units.filter(is_deleted=False).exists():
                raise serializers.ValidationError(
                    "Cannot change Business Domain because this Organization already contains "
                    "active Business Units."
                )
        return value

    def validate_owner_id(self, value):
        """
        Validate owner_id: user must exist and (on update) belong to the org.
        Unlike previous version, owner CAN be assigned during creation.
        The membership check is skipped on create because no BUs exist yet.
        """
        if not value:
            return value

        from apps.iam.models.user import User
        user_exists = User.objects.filter(id=value, is_deleted=False).exists()
        if not user_exists:
            raise serializers.ValidationError("User does not exist or is deleted.")

        if self.instance:
            # On update: verify user belongs to the org via membership
            user_in_org = User.objects.filter(
                id=value,
                bu_memberships_new__business_unit__organization_id=self.instance.id,
                bu_memberships_new__is_active=True,
                bu_memberships_new__is_deleted=False,
            ).exists()
            if not user_in_org:
                raise serializers.ValidationError(
                    "User does not belong to this organization."
                )

        return value

    # ── Object-level validator ────────────────────────────────────────────────
    def validate(self, data: dict) -> dict:
        # Name uniqueness check
        name = data.get("name")
        if name:
            qs = Organization.objects.filter(name=name)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {"name": "An organization with this name already exists."}
                )

        # Coerce blank email to empty string (model stores "" as default, not NULL)
        if "email" in data and data["email"] is None:
            data["email"] = ""

        return data
