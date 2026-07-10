import re

with open('c:/PROJECT/yss_orbit/backend/apps/organization/api/views/organization_view.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the missing org_with_counts in restore
content = content.replace(
    '        return SuccessResponse(\n            data=OrganizationSerializer(org_with_counts, context={"request": request}).data,\n            message="Organization restored successfully.",\n        )',
    '        org_with_counts = self.get_queryset().get(pk=org.pk)\n        return SuccessResponse(\n            data=OrganizationSerializer(org_with_counts, context={"request": request}).data,\n            message="Organization restored successfully.",\n        )'
)

with open('c:/PROJECT/yss_orbit/backend/apps/organization/api/views/organization_view.py', 'w', encoding='utf-8') as f:
    f.write(content)
