import os
import sys
import django
import uuid

sys.path.append(r'c:\PROJECT\yss_orbit\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.organization.models import Organization

User = get_user_model()
# Get superuser
user = User.objects.filter(is_super_admin=True).first()
if not user:
    print("No superuser found.")
    sys.exit(1)

org = Organization.objects.first()

client = APIClient()
client.force_authenticate(user=user)

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

response = client.patch(f'/api/v1/organizations/{org.id}/', payload, format='json')
print(f"Status: {response.status_code}")
print(f"Body: {response.content.decode('utf-8')}")
