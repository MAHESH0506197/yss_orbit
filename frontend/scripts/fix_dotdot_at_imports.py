import os
from pathlib import Path

SRC_DIR = Path(r"c:\PROJECT\yss_orbit\frontend\src")

def fix_all_imports():
    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            if f.endswith(".tsx") or f.endswith(".ts"):
                file_path = Path(root) / f
                try:
                    with open(file_path, "r", encoding="utf-8") as file:
                        content = file.read()
                        
                    # Fix instances of `../@/`
                    new_content = content.replace("../@/", "@/")
                    
                    if content != new_content:
                        with open(file_path, "w", encoding="utf-8") as file:
                            file.write(new_content)
                except Exception as e:
                    pass

if __name__ == "__main__":
    fix_all_imports()
