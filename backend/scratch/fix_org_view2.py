import re

with open('c:/PROJECT/yss_orbit/backend/apps/organization/api/views/organization_view.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace in update
content = re.sub(
    r'(org = self\.service\.update_organization\([\s\S]*?\n\s*\))',
    r'\1\n        org_with_counts = self.get_queryset().get(pk=org.pk)',
    content
)

# Replace in restore
content = re.sub(
    r'(org = self\.service\.restore_organization\([\s\S]*?\n\s*\))',
    r'\1\n        org_with_counts = self.get_queryset().get(pk=org.pk)',
    content
)

with open('c:/PROJECT/yss_orbit/backend/apps/organization/api/views/organization_view.py', 'w', encoding='utf-8') as f:
    f.write(content)
