from rest_framework import serializers
from apps.iam.models import UserSession

class UserSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for UserSession model.
    Used for listing active sessions on the user's profile.
    """
    is_current = serializers.SerializerMethodField()

    class Meta:
        model = UserSession
        fields = [
            "id",
            "device_info",
            "ip_address",
            "user_agent",
            "created_at",
            "last_active_at",
            "expires_at",
            "is_current"
        ]
        read_only_fields = fields

    def get_is_current(self, obj) -> bool:
        """
        Determines if this session matches the current request's session token.
        """
        request = self.context.get("request")
        if not request or not hasattr(request, "auth") or not isinstance(request.auth, dict):
            return False
            
        current_jti = request.auth.get("jti")
        return obj.refresh_token_jti == current_jti
