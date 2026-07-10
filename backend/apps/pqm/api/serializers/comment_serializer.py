# yss_orbit\backend\apps\pqm\api\serializers\comment_serializer.py
from rest_framework import serializers
from apps.pqm.models import PQMComment


class CommentSerializer(serializers.ModelSerializer):
    author_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = PQMComment
        fields = [
            "id", "nc", "author_id", "body",
            "is_internal", "parent", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "author_id", "created_at", "updated_at"]
