import re

with open('c:/PROJECT/yss_orbit/backend/apps/organization/api/views/organization_view.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace in create
content = re.sub(
    r'(org = self\.service\.create_org\([\s\S]*?\n\s*\))',
    r'\1\n        org_with_counts = self.get_queryset().get(pk=org.pk)',
    content
)
content = content.replace(
    'OrganizationCreateUpdateSerializer(org, context={"request": request}).data,',
    'OrganizationCreateUpdateSerializer(org_with_counts, context={"request": request}).data,'
)
content = content.replace(
    'OrganizationSerializer(org, context={"request": request}).data,',
    'OrganizationSerializer(org_with_counts, context={"request": request}).data,'
)


# Replace in update
content = re.sub(
    r'(org = self\.service\.update_org\([\s\S]*?\n\s*\))',
    r'\1\n            org_with_counts = self.get_queryset().get(pk=org.pk)',
    content
)

# Replace in restore
content = re.sub(
    r'(org = self\.service\.restore_org\([\s\S]*?\n\s*\))',
    r'\1\n            org_with_counts = self.get_queryset().get(pk=org.pk)',
    content
)

with open('c:/PROJECT/yss_orbit/backend/apps/organization/api/views/organization_view.py', 'w', encoding='utf-8') as f:
    f.write(content)
