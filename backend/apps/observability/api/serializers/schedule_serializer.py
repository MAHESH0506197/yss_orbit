# yss_orbit\backend\apps\reporting\api\serializers\schedule_serializer.py
from rest_framework import serializers
from apps.observability.models.schedule import Schedule

class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = '__all__'
