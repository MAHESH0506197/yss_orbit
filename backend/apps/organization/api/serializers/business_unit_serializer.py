# yss_orbit/backend/apps/business_unit/api/serializers/business_unit_serializer.py
"""
YSS Orbit — Business Unit Serializers
Three-tier pattern (List / Full / Write) synchronized with BusinessUnit model.

ENTERPRISE AUDIT FIXES:
  ✅ CRITICAL C-03/04/05: GST_REGEX, PAN_REGEX, HEX_REGEX, PHONE_REGEX are now
     compiled re.Pattern objects from constants. .match() calls no longer crash.
  ✅ ISSUE-03: _get_brand_config() caches prefetch result — no more 6× .all() calls per BU.
  ✅ ISSUE-04: _BrandingMixin extracts shared branding + counts logic — no duplication.
  ✅ MED-11:  cascade_deleted field added to both read serializers.
  ✅ Added deleted_reason, restored_at, restored_by_id, restored_reason to BusinessUnitSerializer.
"""
from __future__ import annotations

from rest_framework import serializers

from apps.organization.models import BusinessUnit
from apps.organization.constants.constants import GST_REGEX, PAN_REGEX, HEX_REGEX, PHONE_REGEX, CODE_REGEX


# ─── Shared Branding Mixin ────────────────────────────────────────────────────
class _BrandingMixin:
    """
    Caches brand_configuration for each BU object so the prefetch is evaluated
    only once per object instead of once per SerializerMethodField.
    Eliminates 6N extra queries on list endpoints.
    """

    def _get_brand_config(self, obj: BusinessUnit):
        """Return first non-deleted brand config, or None. Uses prefetch cache."""
        # `brand_configurations` is prefetched in get_queryset() for list/retrieve.
        # Calling .all() on a prefetched relation returns the cached result set.
        if not hasattr(obj, "_cached_brand_config"):
            configs = obj.brand_configurations.all()
            object.__setattr__(obj, "_cached_brand_config", configs[0] if configs else None)
        return obj._cached_brand_config

    def get_branding_mode(self, obj: BusinessUnit) -> str:
        cfg = self._get_brand_config(obj)
        return cfg.branding_mode if cfg else "platform"

    # Removing get_primary_color, get_favicon_url, get_secondary_color, get_company_name

    def get_custom_domain(self, obj: BusinessUnit):
        cfg = self._get_brand_config(obj)
        return cfg.custom_domain if cfg else None

    def get_domain_status(self, obj: BusinessUnit):
        cfg = self._get_brand_config(obj)
        return cfg.domain_status if cfg else "pending"

    def get_ssl_status(self, obj: BusinessUnit):
        cfg = self._get_brand_config(obj)
        return cfg.ssl_status if cfg else "pending"

    def get_business_domain_name(self, obj: BusinessUnit):
        return obj.business_domain.name if obj.business_domain else None

    def get_users_count(self, obj: BusinessUnit) -> int:
        # Prefer annotated value if queryset-level annotation was done
        if hasattr(obj, "users_count_annotated"):
            return obj.users_count_annotated or 0
        try:
            from apps.organization.models.user_business_unit_model import UserBusinessUnitModel
            return (
                UserBusinessUnitModel.objects
                .filter(business_unit_id=obj.id, is_deleted=False, is_active_membership=True)
                .values("user_id")
                .distinct()
                .count()
            )
        except Exception:
            return 0

    def get_roles_count(self, obj: BusinessUnit) -> int:
        if hasattr(obj, "roles_count_annotated"):
            return obj.roles_count_annotated or 0
        try:
            from apps.iam.models.rbac_models import Role
            return Role.objects.filter(business_unit_id=obj.id, is_deleted=False).count()
        except Exception:
            return 0


# ─── List Serializer (lightweight for list endpoints) ─────────────────────────
class BusinessUnitListSerializer(_BrandingMixin, serializers.ModelSerializer):
    organization_name    = serializers.CharField(source="organization.name", read_only=True)
    business_domain_name = serializers.SerializerMethodField()
    effective_timezone   = serializers.CharField(read_only=True)
    effective_currency   = serializers.CharField(read_only=True)
    branding_mode        = serializers.SerializerMethodField()
    custom_domain        = serializers.SerializerMethodField()
    domain_status        = serializers.SerializerMethodField()
    ssl_status           = serializers.SerializerMethodField()
    users_count          = serializers.SerializerMethodField()
    roles_count          = serializers.SerializerMethodField()

    class Meta:
        model  = BusinessUnit
        fields = [
            "id", "organization_id", "organization_name",
            "name", "code", "business_domain_id", "business_domain_name",
            "email", "phone",
            "city", "state", "country",
            "logo_url",
            "is_main_branch", "is_active", "is_deleted", "cascade_deleted",
            "deleted_at",
            "effective_timezone", "effective_currency",
            "branding_mode", "custom_domain", "domain_status", "ssl_status",
            "users_count", "roles_count",
            "created_at", "updated_at",
        ]


# ─── Full Read Serializer (single-object reads) ────────────────────────────────
class BusinessUnitSerializer(_BrandingMixin, serializers.ModelSerializer):
    """Full representation for retrieve / create / update responses."""
    organization_name    = serializers.CharField(source="organization.name", read_only=True)
    business_domain_name = serializers.SerializerMethodField()
    effective_timezone   = serializers.CharField(read_only=True)
    effective_currency   = serializers.CharField(read_only=True)
    branding_mode        = serializers.SerializerMethodField()
    custom_domain        = serializers.SerializerMethodField()
    domain_status        = serializers.SerializerMethodField()
    ssl_status           = serializers.SerializerMethodField()
    users_count          = serializers.SerializerMethodField()
    roles_count          = serializers.SerializerMethodField()

    class Meta:
        model  = BusinessUnit
        fields = [
            # System
            "id", "is_active", "is_deleted", "deleted_at", "deleted_by_id",
            "created_at", "updated_at", "created_by_id", "updated_by_id",
            # Audit reasons
            "created_reason", "updated_reason",
            "deleted_reason",
            # Restore audit (parity with BusinessDomain + Organization)
            "restored_at", "restored_by_id", "restored_reason",
            # Identity
            "organization_id", "organization_name",
            "name", "code", "business_domain_id", "business_domain_name",
            # Contact
            "email", "phone",
            # Address
            "address_line1", "address_line2", "city", "state", "country", "pincode",
            # Compliance
            "registration_number", "gst_number", "pan_number",
            # Locale
            "timezone", "currency_code",
            "effective_timezone", "effective_currency",
            # Branding
            "logo_url", "branding_mode",
            "custom_domain", "domain_status", "ssl_status",
            "users_count", "roles_count",
            # References
            "manager_id",
            # Flags
            "is_main_branch", "cascade_deleted",
        ]
        read_only_fields = [
            "id", "is_deleted", "deleted_at", "deleted_by_id",
            "created_at", "updated_at", "created_by_id", "updated_by_id",
            "created_reason", "updated_reason", "deleted_reason",
            "restored_at", "restored_by_id", "restored_reason",
            "cascade_deleted",
        ]


# ─── Write Serializer (create / update) ───────────────────────────────────────
class BusinessUnitCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Validates and accepts create/partial_update data.
    organization_id is NEVER accepted from the request body — injected by the view.
    business_domain_id is a computed/read-only concept — not accepted as write input.
    """
    branding_mode = serializers.ChoiceField(
        choices=[("platform", "Platform"), ("co_brand", "Co-Brand"), ("white_label", "White Label")],
        required=False,
        write_only=True,
    )
    custom_domain = serializers.CharField(
        max_length=255, required=False, allow_blank=True, write_only=True,
    )
    domain_status = serializers.ChoiceField(choices=[("pending", "Pending"), ("verified", "Verified"), ("failed", "Failed")], required=False, write_only=True)
    ssl_status = serializers.ChoiceField(choices=[("pending", "Pending"), ("active", "Active"), ("failed", "Failed")], required=False, write_only=True)


    class Meta:
        model  = BusinessUnit
        fields = [
            "name", "code",
            "email", "phone",
            "address_line1", "address_line2", "city", "state", "country", "pincode",
            "registration_number", "gst_number", "pan_number",
            "timezone", "currency_code",
            "logo_url", "branding_mode", "custom_domain",
            "domain_status", "ssl_status",
            "manager_id",
            "is_main_branch", "is_active",
            "reason",
        ]

    reason = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # ── Field validators ──────────────────────────────────────────────────────
    def validate_name(self, value: str) -> str:
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Business unit name is required.")
        return name
    def validate_code(self, value: str) -> str:
        code = value.strip().upper()
        if not CODE_REGEX.match(code):
            raise serializers.ValidationError(
                "Code must be 2-20 uppercase alphanumeric characters (hyphens/underscores allowed)."
            )
        return code
    def validate_gst_number(self, value: str) -> str:
        if value and not GST_REGEX.match(value.strip().upper()):
            raise serializers.ValidationError(
                "Invalid GST number format. Expected: 22AAAAA0000A1Z5"
            )
        return value.strip().upper() if value else value

    def validate_pan_number(self, value: str) -> str:
        if value and not PAN_REGEX.match(value.strip().upper()):
            raise serializers.ValidationError(
                "Invalid PAN number format. Expected: ABCDE1234F"
            )
        return value.strip().upper() if value else value

    # validate_primary_color removed

    def validate_phone(self, value: str) -> str:
        if value and not PHONE_REGEX.match(value.strip()):
            raise serializers.ValidationError("Invalid phone number format.")
        return value.strip() if value else value

    # ── Object-level validation ───────────────────────────────────────────────
    def validate(self, data: dict) -> dict:
        instance = self.instance
        org_id   = self.context.get("org_id")
        if not org_id and instance:
            org_id = instance.organization_id

        # Name uniqueness within org. The database constraint is the final guard,
        # but serializer validation keeps API errors predictable and field-specific.
        name = data.get("name")
        if name and org_id:
            from apps.organization.repositories.business_unit_repository import BusinessUnitRepository
            exclude_id = instance.id if instance else None
            if BusinessUnitRepository.name_exists(org_id, name, exclude_id=exclude_id):
                raise serializers.ValidationError(
                    {"name": f"A business unit named '{name}' already exists in this organization."}
                )

        # Code uniqueness within org
        code = data.get("code")
        if code and org_id:
            from apps.organization.repositories.business_unit_repository import BusinessUnitRepository
            exclude_id = instance.id if instance else None
            if BusinessUnitRepository.code_exists(org_id, code, exclude_id=exclude_id):
                raise serializers.ValidationError(
                    {"code": f"A business unit with code '{code}' already exists in this organization."}
                )

        # Main branch uniqueness
        if data.get("is_main_branch") and org_id:
            from apps.organization.repositories.business_unit_repository import BusinessUnitRepository
            exclude_id = instance.id if instance else None
            already_main = instance.is_main_branch if instance else False
            if not already_main and BusinessUnitRepository.has_main_branch(org_id, exclude_id=exclude_id):
                raise serializers.ValidationError(
                    {"is_main_branch": "This organization already has a main branch. Only one is allowed."}
                )

        return data
