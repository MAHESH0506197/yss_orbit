import os
import re

FRONTEND_DIR = r"c:\PROJECT\yss_orbit\frontend\src"

DOMAINS = ["audit", "errorLog", "featureFlags", "subscription", "tenantSettings", "tenantModule", "moduleRegistry"]
TARGET_DIRS = ["api", "components", "constants", "hooks", "routes", "services", "state", "types", "utils"]

# Match absolute imports like "@/pages/audit/components/..."
absolute_pattern = re.compile(r"(@/pages/)(%s)/(%s)" % (
    "|".join(DOMAINS),
    "|".join(TARGET_DIRS)
))

# Match relative imports from within pages to pages/domain/features:
# e.g. from inside src/pages/something: "../../pages/audit/types/..." -> "@/features/audit/types/..."
relative_to_pages_pattern = re.compile(r"(['\"])(?:\.\./)+pages/(%s)/(%s)" % (
    "|".join(DOMAINS),
    "|".join(TARGET_DIRS)
))

# Match relative imports from within pages/domain to features:
# e.g. from inside src/pages/audit: "./types/..." -> "@/features/audit/types/..."
relative_local_pattern = re.compile(r"(['\"])(?:\.\/|\.\.\/)+?(%s)/" % (
    "|".join(TARGET_DIRS)
))

def fix_imports():
    for root, dirs, files in os.walk(FRONTEND_DIR):
        for file in files:
            if not (file.endswith(".ts") or file.endswith(".tsx")):
                continue
                
            file_path = os.path.join(root, file)
            
            # Skip if we are inside the feature folder ourselves, except to fix relative imports
            is_in_pages_domain = any(f"pages\\{domain}" in file_path for domain in DOMAINS)
            current_domain = next((d for d in DOMAINS if f"pages\\{d}" in file_path), None)

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
            except UnicodeDecodeError:
                continue
                
            original_content = content
            
            # 1. Fix global absolute imports: @/pages/domain/feature -> @/features/domain/feature
            content = absolute_pattern.sub(r"@/features/\2/\3", content)
            
            # 2. Fix relative cross-domain imports that point to pages
            content = relative_to_pages_pattern.sub(r"\1@/features/\2/\3", content)
            
            # 3. If we are inside the pages/domain/ directory, our local relative imports to features
            # need to become @/features/domain/...
            if is_in_pages_domain and current_domain:
                # Replace local imports like "./api/..." or "../components/..."
                def local_repl(match):
                    quote = match.group(1)
                    target_dir = match.group(2)
                    return f"{quote}@/features/{current_domain}/{target_dir}/"
                content = relative_local_pattern.sub(local_repl, content)
                
            if content != original_content:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Fixed: {file_path}")

if __name__ == "__main__":
    fix_imports()
