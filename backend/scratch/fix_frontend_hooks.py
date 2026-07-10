import re

with open('c:/PROJECT/yss_orbit/frontend/src/features/organization/hooks/useOrganizations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '  delete: async (id: string): Promise<void> => {\n    await apiClient.delete(`${BASE}/${id}/`);\n  },',
    '  delete: async (id: string, reason?: string): Promise<void> => {\n    await apiClient.delete(`${BASE}/${id}/`, { data: { reason } });\n  },'
)

content = content.replace(
    '  restore: async (id: string): Promise<Organization> => {\n    const response = await apiClient.post(`${BASE}/${id}/restore/`);\n    return unwrapSingle(response);\n  },',
    '  restore: async (id: string, reason?: string): Promise<Organization> => {\n    const response = await apiClient.post(`${BASE}/${id}/restore/`, { reason });\n    return unwrapSingle(response);\n  },'
)

with open('c:/PROJECT/yss_orbit/frontend/src/features/organization/hooks/useOrganizations.ts', 'w', encoding='utf-8') as f:
    f.write(content)
