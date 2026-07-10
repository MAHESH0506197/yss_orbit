import os
import re
from pathlib import Path

SRC_DIR = Path(r"c:\PROJECT\yss_orbit\frontend\src")

def fix_any_lambdas():
    pattern = re.compile(r"([a-zA-Z0-9_]+):\s*any\s*=>")
    
    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            if f.endswith(".tsx") or f.endswith(".ts"):
                file_path = Path(root) / f
                try:
                    with open(file_path, "r", encoding="utf-8") as file:
                        content = file.read()
                        
                    # Fix instances like `emp: any =>` to `(emp: any) =>`
                    # Only if they aren't already preceded by a parenthesis
                    # Wait, if they are `(s: any =>`, my previous regex replacement turned `s =>` into `s: any =>`.
                    # Let's just fix `([a-zA-Z0-9_]+):\s*any\s*=>` to `(\1: any) =>` everywhere, but if it's already inside `((s: any) =>`, we might double it.
                    # A safer approach:
                    # Find all `([a-zA-Z0-9_]+):\s*any\s*=>` that are NOT preceded by `(`
                    new_content = re.sub(r"(?<!\()([a-zA-Z0-9_]+):\s*any\s*=>", r"(\1: any) =>", content)
                    # Also fix `(([a-zA-Z0-9_]+):\s*any\s*=>`
                    new_content = re.sub(r"\(([a-zA-Z0-9_]+):\s*any\s*=>", r"((\1: any) =>", new_content)

                    if content != new_content:
                        with open(file_path, "w", encoding="utf-8") as file:
                            file.write(new_content)
                except Exception as e:
                    pass

if __name__ == "__main__":
    fix_any_lambdas()
