import re

with open('c:/PROJECT/yss_orbit/frontend/src/features/organization/hooks/useOrganizations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'mutationFn: ({ id, reason }: { id: string; reason?: string }) => organizationApi.delete(id),',
    'mutationFn: ({ id, reason }: { id: string; reason?: string }) => organizationApi.delete(id, reason),'
)

content = content.replace(
    'mutationFn: ({ id, reason }: { id: string; reason?: string }) => organizationApi.restore(id),',
    'mutationFn: ({ id, reason }: { id: string; reason?: string }) => organizationApi.restore(id, reason),'
)

with open('c:/PROJECT/yss_orbit/frontend/src/features/organization/hooks/useOrganizations.ts', 'w', encoding='utf-8') as f:
    f.write(content)
