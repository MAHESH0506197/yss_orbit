# yss_orbit\fix_models.py
import os
import re

# 1. Update organizations/models.py
org_models_path = r'backend\apps\organizations\models.py'
with open(org_models_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove BusinessUnit from organizations/models.py
bu_split = content.split('class BusinessUnit(BaseModel):')
if len(bu_split) > 1:
    org_only = bu_split[0]
    bu_only = 'class BusinessUnit(BaseModel):' + bu_split[1]
    with open(org_models_path, 'w', encoding='utf-8') as f:
        f.write(org_only.strip() + '\n')
    
    # 2. Write business_units/models.py
    bu_models_path = r'backend\apps\business_units\models.py'
    bu_content = '''"""
Business Unit Models.
"""
from __future__ import annotations

import uuid

from django.db import models

from apps.core.models import BaseModel
from apps.organizations.models import Organization

''' + bu_only.strip() + '\n'
    with open(bu_models_path, 'w', encoding='utf-8') as f:
        f.write(bu_content)

# 3. Update imports in business_units app
bu_dir = r'backend\apps\business_units'
for root, _, files in os.walk(bu_dir):
    for file in files:
        if file.endswith('.py'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            if 'apps.organizations.models import BusinessUnit' in content:
                content = content.replace('apps.organizations.models import BusinessUnit', 'apps.business_units.models import BusinessUnit')
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
            elif 'from apps.organizations.models import Organization, BusinessUnit' in content:
                content = content.replace('from apps.organizations.models import Organization, BusinessUnit', 'from apps.organizations.models import Organization\nfrom apps.business_units.models import BusinessUnit')
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)

print("Fixed organizations and business_units models")
