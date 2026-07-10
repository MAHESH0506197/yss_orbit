import re

with open('c:/PROJECT/yss_orbit/backend/apps/organization/api/views/business_domain_view.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace in create
content = re.sub(
    r'(domain = self\.service\.create_domain\([\s\S]*?\n\s*\))',
    r'\1\n        domain_with_counts = self.get_queryset().get(pk=domain.pk)',
    content
)
content = content.replace(
    'BusinessDomainSerializer(domain, context={"request": request}).data,',
    'BusinessDomainSerializer(domain_with_counts, context={"request": request}).data,'
)

# Replace in update
content = re.sub(
    r'(domain = self\.service\.update_domain\([\s\S]*?\n\s*\))',
    r'\1\n            domain_with_counts = self.get_queryset().get(pk=domain.pk)',
    content
)

# Replace in restore
content = re.sub(
    r'(domain = self\.service\.restore_domain\([\s\S]*?\n\s*\))',
    r'\1\n            domain_with_counts = self.get_queryset().get(pk=domain.pk)',
    content
)

with open('c:/PROJECT/yss_orbit/backend/apps/organization/api/views/business_domain_view.py', 'w', encoding='utf-8') as f:
    f.write(content)
