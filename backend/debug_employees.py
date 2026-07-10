import os
import django
import sys
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.test import Client
from apps.iam.models import User

c = Client()
try:
    user = User.objects.first()
    c.force_login(user)
    r = c.get('/api/v1/hrms/employees/', HTTP_X_BUSINESS_UNIT_ID='00000000-0000-0000-0000-000000000000')
    print("STATUS", r.status_code)
    print("CONTENT", r.content)
except Exception as e:
    traceback.print_exc()
