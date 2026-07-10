import re
import os

files_to_fix = [
    'src/features/payroll/ITDeclarationsPage.tsx',
    'src/features/payroll/PayrollCompliancePage.tsx',
    'src/features/payroll/PayrollDashboardPage.tsx',
    'src/features/payroll/components/SalaryBuilder.tsx'
]

for file_path in files_to_fix:
    full_path = os.path.join('C:/PROJECT/yss_orbit/frontend', file_path)
    if not os.path.exists(full_path):
        continue
    
    with open(full_path, 'r', encoding='utf8') as f:
        content = f.read()

    # In ITDeclarationsPage, remove the duplicated lines 1 to 60.
    if 'ITDeclarationsPage.tsx' in file_path:
        if content.count('type TaxRegime') > 1:
            idx = content.find('import React')
            if idx > 0 and idx < 10000:
                content = content[idx:]

    # Remove all existing `const { t } = useTranslation();`
    content = re.sub(r'^\s*const \{ t \} = useTranslation\(\);\s*$', '', content, flags=re.MULTILINE)
    
    # Inject it directly after any `React.FC = () => {` or similar patterns
    # Find all components:
    # 1. const Name: React.FC... = (...) => {
    # 2. export const Name: React.FC... = (...) => {
    
    pattern = r'^((?:export\s+)?const\s+[A-Za-z0-9_]+\s*:\s*React\.FC[^=]*=\s*\([^)]*\)\s*=>\s*\{)'
    
    def replacer(match):
        return match.group(1) + '\n  const { t } = useTranslation();'
        
    content = re.sub(pattern, replacer, content, flags=re.MULTILINE)
    
    with open(full_path, 'w', encoding='utf8') as f:
        f.write(content)
