import os
import sys
import django

sys.path.append(r'c:\PROJECT\yss_orbit\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.organization.models import Organization

User = get_user_model()
user = User.objects.filter(is_super_admin=True).first()

org = Organization.objects.first()

client = APIClient()
client.force_authenticate(user=user)

payload = {
    "name": org.name,
    "is_active": False,
    "logo_url": org.logo_url,
    "owner_id": None,
    "business_domain_id": "", # Simulate what react-hook-form does when passing empty string
    "email": org.email,
    "phone": org.phone,
    "reason": "status changed to inactive"
}

response = client.patch(f'/api/v1/organizations/{org.id}/', payload, format='json')
print(f"Status: {response.status_code}")
print(f"Body: {response.content.decode('utf-8')}")
