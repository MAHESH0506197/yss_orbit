import os
import sys
import django

sys.path.append(r'c:\PROJECT\yss_orbit\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.organization.models import Organization
from apps.organization.api.serializers.organization_serializer import OrganizationCreateUpdateSerializer
from rest_framework import serializers

class TestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['name']

# Try passing an unknown field
serializer = TestSerializer(data={"name": "Test", "unknown_field": "xyz"})
print("TestSerializer is valid?", serializer.is_valid())
print("Validated data:", serializer.validated_data)
if not serializer.is_valid():
    print("Errors:", serializer.errors)
