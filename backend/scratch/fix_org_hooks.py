import re

with open('c:/PROJECT/yss_orbit/frontend/src/features/organization/hooks/useOrganizations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix mutations mapping
content = content.replace('organizationApi.createOrganization', 'organizationApi.create')
content = content.replace('organizationApi.updateOrganization(id, payload)', 'organizationApi.update(id, payload)')
content = content.replace('organizationApi.updateOrganizationSettings(id, payload)', 'organizationApi.updateSettings(id, payload)')
content = content.replace('organizationApi.deleteOrganization(id, reason)', 'organizationApi.delete(id)')
content = content.replace('organizationApi.restoreOrganization(id, reason)', 'organizationApi.restore(id)')
content = content.replace('organizationApi.uploadOrganizationLogo(id, file)', 'organizationApi.uploadLogo(id, file)')

with open('c:/PROJECT/yss_orbit/frontend/src/features/organization/hooks/useOrganizations.ts', 'w', encoding='utf-8') as f:
    f.write(content)
