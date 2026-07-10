# yss_orbit\backend\apps\events\serializers.py
from rest_framework import serializers
from apps.platform.models import EventOutbox, EventDeadLetter, ProcessedEvent

class EventOutboxSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventOutbox
        fields = "__all__"

class EventDeadLetterSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventDeadLetter
        fields = "__all__"

class ProcessedEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessedEvent
        fields = "__all__"
