# yss_orbit\backend\apps\pqm\api\serializers\dashboard_serializer.py
from rest_framework import serializers


class DashboardSummarySerializer(serializers.Serializer):
    total_ncs            = serializers.IntegerField()
    open_ncs             = serializers.IntegerField()
    closed_ncs           = serializers.IntegerField()
    overdue_ncs          = serializers.IntegerField()
    critical_ncs         = serializers.IntegerField()
    high_priority_ncs    = serializers.IntegerField()
    safety_critical_open = serializers.IntegerField()
    avg_closure_days     = serializers.FloatField()
    sla_compliance_pct   = serializers.FloatField()
    reopen_rate_pct      = serializers.FloatField()
