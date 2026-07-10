import os
import sys
import django
import json

sys.path.append(r'c:\PROJECT\yss_orbit\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from apps.organization.models import Organization, BusinessDomain
from apps.organization.api.serializers.organization_serializer import OrganizationCreateUpdateSerializer

# Fetch an existing organization
org = Organization.objects.first()

payload = {
    "name": org.name,
    "is_active": False,
    "logo_url": org.logo_url,
    "owner_id": org.owner_id,
    "business_domain_id": org.business_domain_id,
    "email": org.email,
    "phone": org.phone,
    "headquarters_address_1": org.headquarters_address_1,
    "headquarters_address_2": org.headquarters_address_2,
    "city": org.city,
    "state": org.state,
    "country": org.country,
    "postal_code": org.postal_code,
    "timezone": org.timezone,
    "currency_code": org.currency_code,
    "reason": "status changed to inactive"
}

# Simulate frontend payload missing some fields (e.g. if they are null)
serializer = OrganizationCreateUpdateSerializer(org, data=payload, partial=True)
if serializer.is_valid():
    print("Valid!")
    print(serializer.validated_data)
else:
    print("Invalid!")
    print(serializer.errors)
