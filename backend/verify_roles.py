import os
import django

# Setup django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.iam.models.rbac_models import Role, RolePermission
from apps.iam.models import User
from apps.organization.models.business_unit_model import BusinessUnit
from apps.iam.api.views.role_view import RoleViewSet
from rest_framework.test import APIRequestFactory, force_authenticate
import sys

factory = APIRequestFactory()

user = User.objects.filter(is_super_admin=True).first()
if not user:
    user = User.objects.create(email='testadmin@example.com', is_super_admin=True, is_active=True)

bu = BusinessUnit.objects.first()
if not bu:
    from apps.organization.models.organization_model import Organization
    org = Organization.objects.first()
    if not org:
        org = Organization.objects.create(name="Test Org")
    bu = BusinessUnit.objects.create(name="Test BU", organization=org)

import time
unique_suffix = str(int(time.time()))

try:
    # 1. Create Role
    print("1. Testing Create Role")
    create_request = factory.post('/api/roles/', {
        'name': f'Test Role X {unique_suffix}',
        'description': 'Test Role Desc',
        'role_type': 'CUSTOM',
        'business_unit_id': str(bu.id),
        'is_default': False,
        'permissions': []
    }, format='json')
    force_authenticate(create_request, user=user)
    view = RoleViewSet.as_view({'post': 'create'})
    response = view(create_request)
    print("Create Status:", response.status_code)
    if response.status_code == 201:
        role_id = response.data['data']['id']
        print("Created Role ID:", role_id)
    else:
        print("Create Response:", response.data)
        sys.exit(1)

    # 2. Edit Role
    print("2. Testing Edit Role")
    edit_request = factory.patch(f'/api/roles/{role_id}/', {
        'name': f'Test Role X {unique_suffix} Updated',
    }, format='json')
    force_authenticate(edit_request, user=user)
    view = RoleViewSet.as_view({'patch': 'partial_update'})
    response = view(edit_request, pk=role_id)
    print("Edit Status:", response.status_code)
    if response.status_code != 200:
        print("Edit Response:", response.data)

    # 3. Search and Filter
    print("3. Testing Search and Filter")
    search_request = factory.get('/api/roles/?search=Updated&role_type=CUSTOM')
    force_authenticate(search_request, user=user)
    view = RoleViewSet.as_view({'get': 'list'})
    response = view(search_request)
    print("Search Status:", response.status_code)
    if response.status_code == 200:
        print("Found roles:", len(response.data['data']))
        print("Meta:", response.data['meta'])

    # 4. Delete Role
    print("4. Testing Delete Role")
    delete_request = factory.delete(f'/api/roles/{role_id}/')
    force_authenticate(delete_request, user=user)
    view = RoleViewSet.as_view({'delete': 'destroy'})
    response = view(delete_request, pk=role_id)
    print("Delete Status:", response.status_code)
    
    print("--- VALIDATION COMPLETE ---")
except Exception as e:
    print(f"Error occurred: {e}")
    sys.exit(1)
