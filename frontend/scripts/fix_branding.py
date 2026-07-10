import os
import re
from pathlib import Path

SRC_DIR = Path(r"c:\PROJECT\yss_orbit\frontend\src")

def fix_branding_imports():
    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            if f.endswith(".tsx") or f.endswith(".ts"):
                file_path = Path(root) / f
                try:
                    with open(file_path, "r", encoding="utf-8") as file:
                        content = file.read()
                        
                    new_content = content.replace("@/hooks/useBrandingContext", "@/utils/shared/hooks/useBrandingContext")
                    new_content = new_content.replace("../../shared/hooks/useBrandingContext", "@/utils/shared/hooks/useBrandingContext")
                    
                    if content != new_content:
                        with open(file_path, "w", encoding="utf-8") as file:
                            file.write(new_content)
                except Exception as e:
                    pass

if __name__ == "__main__":
    fix_branding_imports()
