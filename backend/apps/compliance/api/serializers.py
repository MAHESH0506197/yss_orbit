from rest_framework import serializers
from apps.compliance.models import ConsentRecord, DataSubjectRequest

class ConsentRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsentRecord
        fields = ['id', 'user', 'policy_version', 'consent_type', 'is_granted', 'channel', 'granted_at', 'withdrawn_at']
        read_only_fields = ['id', 'user', 'granted_at', 'withdrawn_at']


class DataSubjectRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSubjectRequest
        fields = ['id', 'user', 'request_type', 'status', 'details', 'created_at', 'resolved_at']
        read_only_fields = ['id', 'user', 'status', 'created_at', 'resolved_at']
