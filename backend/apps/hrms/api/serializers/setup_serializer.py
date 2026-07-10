from rest_framework import serializers
from apps.hrms.models import LeaveRestrictionWindow, HolidayCalendar, Holiday

class LeaveRestrictionWindowSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRestrictionWindow
        fields = ['id', 'name', 'start_date', 'end_date', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = ['id', 'calendar', 'name', 'date', 'is_optional', 'is_active', 'created_at']
        read_only_fields = ['id', 'calendar', 'created_at']


class HolidayCalendarSerializer(serializers.ModelSerializer):
    holidays = HolidaySerializer(many=True, read_only=True)
    
    class Meta:
        model = HolidayCalendar
        fields = ['id', 'name', 'year', 'is_default', 'is_active', 'created_at', 'holidays']
        read_only_fields = ['id', 'created_at']
