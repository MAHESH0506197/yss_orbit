import os
import re
from pathlib import Path

SRC_DIR = Path(r"c:\PROJECT\yss_orbit\frontend\src")

def fix_all_any_dot():
    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            if f.endswith(".tsx") or f.endswith(".ts"):
                file_path = Path(root) / f
                try:
                    with open(file_path, "r", encoding="utf-8") as file:
                        content = file.read()
                        
                    # Fix instances like `m: any.stock` to `m.stock`
                    new_content = re.sub(r"([a-zA-Z0-9_]+):\s*any\.", r"\1.", content)
                    
                    if content != new_content:
                        with open(file_path, "w", encoding="utf-8") as file:
                            file.write(new_content)
                except Exception as e:
                    pass

if __name__ == "__main__":
    fix_all_any_dot()
