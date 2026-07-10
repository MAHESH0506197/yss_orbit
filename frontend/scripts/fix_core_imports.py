import os
import re

DOMAINS = ['organization', 'businessUnit', 'rbac', 'users']
PAGES_DIR = os.path.join("frontend", "src", "pages")

for domain in DOMAINS:
    domain_dir = os.path.join(PAGES_DIR, domain)
    if not os.path.exists(domain_dir):
        continue
    for root, _, files in os.walk(domain_dir):
        for file in files:
            if not file.endswith('.tsx') and not file.endswith('.ts'):
                continue
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace relative imports starting with ./ or ../ to @/features/domain/
            new_content = re.sub(r'from [\'"]\.\/(components|hooks|api|services|state|types|utils|constants|routes)(\/.*?)?[\'"]', rf"from '@/features/{domain}/\1\2'", content)
            new_content = re.sub(r'from [\'"]\.\.\/(components|hooks|api|services|state|types|utils|constants|routes)(\/.*?)?[\'"]', rf"from '@/features/{domain}/\1\2'", new_content)
            
            # Additional fix for index.ts exporting from relative paths
            new_content = re.sub(r'export \* from [\'"]\.\/(components|hooks|api|services|state|types|utils|constants|routes)(\/.*?)?[\'"]', rf"export * from '@/features/{domain}/\1\2'", new_content)

            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed {filepath}")

# Global replace of @/pages/businessUnit to @/features/businessUnit
for root, _, files in os.walk(os.path.join("frontend", "src")):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                continue
            new_content = content.replace("@/pages/businessUnit/", "@/features/businessUnit/")
            new_content = new_content.replace("@/pages/organization/", "@/features/organization/")
            new_content = new_content.replace("@/pages/rbac/", "@/features/rbac/")
            new_content = new_content.replace("@/pages/users/", "@/features/users/")
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed global {filepath}")
