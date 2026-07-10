import os
import django
import sys
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.test import Client
from apps.iam.models import User
from apps.organization.models import BusinessUnit
from rest_framework_simplejwt.tokens import AccessToken

c = Client()
try:
    user = User.objects.first()
    bu = BusinessUnit.objects.first()
    
    token = AccessToken.for_user(user)
    
    bu_id = str(bu.id) if bu else '00000000-0000-0000-0000-000000000000'
    
    # We must set the yss_access cookie to bypass CookieJWTAuthentication
    c.cookies['yss_access'] = str(token)
    
    print("Testing /api/v1/platform/context/ with valid BU:", bu_id)
    r = c.get('/api/v1/platform/context/', HTTP_X_BUSINESS_UNIT_ID=bu_id)
    print("STATUS", r.status_code)
    print("CONTENT", r.content)
    
    print("=========================")
    print("Testing /api/v1/hrms/employees/ with valid BU:", bu_id)
    r2 = c.get('/api/v1/hrms/employees/', HTTP_X_BUSINESS_UNIT_ID=bu_id)
    print("STATUS", r2.status_code)
    print("CONTENT", r2.content)
except Exception as e:
    traceback.print_exc()
