# yss_orbit\backend\apps\outbox\api\serializers\outbox_serializer.py
from rest_framework import serializers
from apps.platform.models import OutboxMessage, OutboxDeadLetter

class OutboxMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = OutboxMessage
        fields = "__all__"

class OutboxDeadLetterSerializer(serializers.ModelSerializer):
    class Meta:
        model = OutboxDeadLetter
        fields = "__all__"
