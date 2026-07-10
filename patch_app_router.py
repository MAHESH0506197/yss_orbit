path = r'c:\PROJECT\yss_orbit\frontend\src\routes\AppRouter.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if '<Route path="/admin/roles" element={<RolesPage />} />' in line:
        skip = True
        new_lines.append('            {/* ── Legacy Admin Redirects ─────────────────────────────────────────────────── */}\n')
        new_lines.append('            <Route path="/admin/roles" element={<Navigate to="/platform/roles" replace />} />\n')
        new_lines.append('            <Route path="/admin/subscriptions" element={<Navigate to="/platform/subscriptions" replace />} />\n')
        new_lines.append('            <Route path="/admin/user-bu-mapping" element={<Navigate to="/platform/user-bu-mapping" replace />} />\n')
        new_lines.append('            <Route path="/admin/user-bu-mapping/bu-members" element={<Navigate to="/platform/user-bu-mapping/bu-members" replace />} />\n')
        new_lines.append('            <Route path="/admin/user-bu-mapping/:id" element={<Navigate to="/platform/user-bu-mapping/:id" replace />} />\n')
        new_lines.append('            <Route path="/admin/audit" element={<Navigate to="/platform/audit" replace />} />\n')
        new_lines.append('            <Route path="/admin/errors" element={<Navigate to="/platform/errors" replace />} />\n')
        new_lines.append('            <Route path="/admin/tenant-domains" element={<Navigate to="/platform/tenant-domains" replace />} />\n')
        new_lines.append('            <Route path="/admin/modules" element={<Navigate to="/platform/modules" replace />} />\n')
        new_lines.append('            <Route path="/admin/observability/metrics" element={<Navigate to="/platform/observability/metrics" replace />} />\n')
        new_lines.append('            <Route path="/admin/observability/traces" element={<Navigate to="/platform/observability/traces" replace />} />\n')
        continue
    
    if skip:
        if '</Route>' in line:
            skip = False # stop skipping after the </Route> from SuperAdminGuard
        continue
        
    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Patched successfully')
