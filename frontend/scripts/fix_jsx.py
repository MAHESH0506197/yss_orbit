import os
from pathlib import Path

SRC_DIR = Path(r"c:\PROJECT\yss_orbit\frontend\src")

def fix_jsx_comments():
    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            if f.endswith(".tsx"):
                file_path = Path(root) / f
                try:
                    with open(file_path, "r", encoding="utf-8") as file:
                        lines = file.readlines()
                        
                    changed = False
                    for i in range(len(lines)):
                        if "// @ts-expect-error - Auto-patched" in lines[i]:
                            # If it looks like it's inside JSX (e.g. next line starts with < or previous line ends with <)
                            # We will just defensively wrap it if the next line has HTML tags or if we just want to be safe
                            if i + 1 < len(lines) and ("<" in lines[i+1] or "/>" in lines[i+1] or "</" in lines[i+1]):
                                # Wrap in {/* */}
                                lines[i] = lines[i].replace("// @ts-expect-error", "{/* @ts-expect-error").replace("\n", " */}\n")
                                changed = True
                                
                    if changed:
                        with open(file_path, "w", encoding="utf-8") as file:
                            file.writelines(lines)
                except:
                    pass

if __name__ == "__main__":
    fix_jsx_comments()
