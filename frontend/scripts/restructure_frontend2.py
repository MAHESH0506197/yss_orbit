import os
import shutil
import re
from pathlib import Path

SRC_DIR = Path(r"c:\PROJECT\yss_orbit\frontend\src")

MAPPINGS = [
    # Core
    (r"^core[/\\]hooks(.*)$", r"hooks\1"),
    (r"^core[/\\]types(.*)$", r"types\1"),
    (r"^core[/\\]constants(.*)$", r"constants\1"),
    (r"^core[/\\]store(.*)$", r"store\1"),
    (r"^core(.*)$", r"utils/core\1"),

    # Platform
    (r"^platform[/\\]api(.*)$", r"api\1"),
    (r"^platform[/\\]header(.*)$", r"components/layouts/header\1"),
    (r"^platform[/\\]sidebar(.*)$", r"components/layouts/sidebar\1"),
    (r"^platform(.*)$", r"utils/platform\1"),

    # App
    (r"^app[/\\]store(.*)$", r"store\1"),
    (r"^app(.*)$", r"utils/app\1"),

    # Shared
    (r"^shared(.*)$", r"utils/shared\1"),
    
    # Modules/Features remaining
    (r"^modules(.*)$", r"pages\1"),
    (r"^features(.*)$", r"pages\1"),
]

def run_restructure():
    all_files = []
    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            all_files.append(Path(root) / f)
            
    moves = []
    for file_path in all_files:
        rel_path = file_path.relative_to(SRC_DIR)
        rel_str = rel_path.as_posix()
        
        # skip if already in 10 mandated root folders
        root_dir = rel_path.parts[0]
        if root_dir in ["components", "pages", "hooks", "api", "store", "types", "utils", "constants", "routes", "tests", "assets", "styles"] or root_dir.endswith(".ts") or root_dir.endswith(".tsx"):
            continue

        for pattern, replacement in MAPPINGS:
            if re.match(pattern, rel_str):
                new_str = re.sub(pattern, replacement, rel_str)
                new_path = SRC_DIR / new_str
                moves.append((file_path, new_path))
                break
                
    for old_p, new_p in moves:
        new_p.parent.mkdir(exist_ok=True, parents=True)
        shutil.move(str(old_p), str(new_p))
        print(f"Moved: {old_p.relative_to(SRC_DIR)} -> {new_p.relative_to(SRC_DIR)}")

    for root, dirs, files in os.walk(SRC_DIR, topdown=False):
        for d in dirs:
            dir_path = Path(root) / d
            if not any(dir_path.iterdir()):
                try:
                    dir_path.rmdir()
                except:
                    pass

    # Update imports
    print("\nUpdating imports...")
    alias_replacements = [
        (r"@/core/hooks/", r"@/hooks/"),
        (r"@/core/types/", r"@/types/"),
        (r"@/core/constants/", r"@/constants/"),
        (r"@/core/store/", r"@/store/"),
        (r"@/core/", r"@/utils/core/"),
        (r"@/platform/api/", r"@/api/"),
        (r"@/platform/header/", r"@/components/layouts/header/"),
        (r"@/platform/sidebar/", r"@/components/layouts/sidebar/"),
        (r"@/platform/", r"@/utils/platform/"),
        (r"@/app/store/", r"@/store/"),
        (r"@/app/", r"@/utils/app/"),
        (r"@/shared/", r"@/utils/shared/"),
        (r"@/modules/", r"@/pages/"),
        (r"@/features/", r"@/pages/"),
    ]

    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            if f.endswith(".ts") or f.endswith(".tsx"):
                file_path = Path(root) / f
                try:
                    with open(file_path, "r", encoding="utf-8") as file:
                        content = file.read()
                        
                    new_content = content
                    for pattern, replacement in alias_replacements:
                        new_content = re.sub(pattern, replacement, new_content)
                        
                    if new_content != content:
                        with open(file_path, "w", encoding="utf-8") as file:
                            file.write(new_content)
                except:
                    pass

if __name__ == "__main__":
    run_restructure()
