# yss_orbit\backend\apps\users\api\serializers\user_serializer.py
from rest_framework import serializers
from apps.iam.models.user import User

class UserSerializer(serializers.ModelSerializer):
    """
    Enterprise-grade Serializer for User.
    """
    assignments = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    reason = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True}
        }
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'tenant_id',
            'created_by_id', 'created_reason',
            'updated_by_id', 'updated_reason',
            'deleted_by_id', 'deleted_reason',
            'restored_at', 'restored_by_id', 'restored_reason'
        ]

    def get_avatar(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None

    def get_assignments(self, obj):
        # Use the pre-fetched cache to avoid N+1 and Unnecessary Eager Load exceptions
        memberships = obj.bu_memberships_new.all()
        return [
            {
                "business_unit_name": m.business_unit.name,
                "domain": getattr(m.business_unit, 'domain', 'N/A'),
                "organization_name": m.business_unit.organization.name if getattr(m.business_unit, 'organization', None) else 'Platform',
                "role_name": m.role.name if getattr(m, 'role', None) else None
            }
            for m in memberships
        ]

    def create(self, validated_data):
        validated_data.pop('reason', None)
        password = validated_data.pop('password', None)
        
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save(update_fields=['password'])
        
        return user

    def update(self, instance, validated_data):
        validated_data.pop('reason', None)
        password = validated_data.pop('password', None)
        
        if password:
            instance.set_password(password)
            
        return super().update(instance, validated_data)


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone_number', 'timezone', 'language', 'username', 'mfa_enabled']

class UserInviteSerializer(serializers.Serializer):
    email = serializers.EmailField()
