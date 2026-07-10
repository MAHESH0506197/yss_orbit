import os
import re
from pathlib import Path

SRC_DIR = Path(r"c:\PROJECT\yss_orbit\frontend\src")

def fix_relative_imports():
    pages_dir = SRC_DIR / "pages"
    
    # 1. Fix relative imports inside flattened pages/ directory
    if pages_dir.exists():
        for root, _, files in os.walk(pages_dir):
            for f in files:
                if f.endswith(".ts") or f.endswith(".tsx"):
                    file_path = Path(root) / f
                    # Only target files directly inside pages/<module>/
                    # meaning they have exactly 3 parts relative to src: pages, <module>, <file>
                    try:
                        rel = file_path.relative_to(SRC_DIR)
                        if len(rel.parts) == 3:
                            with open(file_path, "r", encoding="utf-8") as file:
                                content = file.read()
                            
                            # Replace ../components with ./components etc.
                            # because the file moved from modules/<module>/pages/ to pages/<module>/
                            replacements = [
                                (r"\.\./components", r"./components"),
                                (r"\.\./hooks", r"./hooks"),
                                (r"\.\./api", r"./api"),
                                (r"\.\./types", r"./types"),
                                (r"\.\./constants", r"./constants"),
                                (r"\.\./utils", r"./utils"),
                                (r"\.\./services", r"./services"),
                                (r"\.\./state", r"./state"),
                            ]
                            
                            new_content = content
                            for pat, rep in replacements:
                                new_content = re.sub(pat, rep, new_content)
                                
                            if new_content != content:
                                with open(file_path, "w", encoding="utf-8") as file:
                                    file.write(new_content)
                    except Exception as e:
                        pass
                        
    # 2. Fix other remaining @/ aliases that got broken
    alias_replacements = [
        (r"@/platform/api/", r"@/api/"),
        (r"@/platform/telemetry/", r"@/utils/platform/telemetry/"),
        (r"@/core/branding/", r"@/utils/core/branding/"),
        (r"@/modules/branding/", r"@/pages/branding/"),
        (r"../../modules/", r"@/pages/"),
        (r"../../core/", r"@/utils/core/"),
        (r"../guards/DomainGuard", r"@/routes/guards/DomainGuard"),
        (r"../guards/ModuleSubscriptionGuard", r"@/routes/guards/ModuleSubscriptionGuard"),
        (r"../../app/store/appStore", r"@/store/appStore"),
        (r"../services/", r"./services/"), # in store maybe
    ]
    
    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            if f.endswith(".ts") or f.endswith(".tsx"):
                file_path = Path(root) / f
                try:
                    with open(file_path, "r", encoding="utf-8") as file:
                        content = file.read()
                    
                    new_content = content
                    for pat, rep in alias_replacements:
                        new_content = new_content.replace(pat.replace("\\", ""), rep)
                        
                    if new_content != content:
                        with open(file_path, "w", encoding="utf-8") as file:
                            file.write(new_content)
                except Exception as e:
                    pass

    print("Relative imports fixed.")

if __name__ == "__main__":
    fix_relative_imports()
