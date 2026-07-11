# yss_orbit\backend\apps\pqm\api\serializers\comment_serializer.py
from rest_framework import serializers
from apps.pqm.models import PQMComment


class CommentSerializer(serializers.ModelSerializer):
    author_id = serializers.UUIDField(read_only=True)
    author_name = serializers.SerializerMethodField()

    def get_author_name(self, obj):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if obj.author_id:
            user = User.objects.filter(id=obj.author_id).first()
            return f"{user.first_name} {user.last_name}".strip() if user else None
        return None

    class Meta:
        model = PQMComment
        fields = [
            "id", "nc", "author_id", "author_name", "body",
            "is_internal", "parent", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "author_id", "created_at", "updated_at"]
