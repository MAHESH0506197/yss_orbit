import os
import shutil
import re
from pathlib import Path

# The frontend source directory
FRONTEND_DIR = Path(r"c:\PROJECT\yss_orbit\frontend")
SRC_DIR = FRONTEND_DIR / "src"

# Target structure mandated by F01
MANDATED_FOLDERS = [
    "components",
    "pages",
    "hooks",
    "api",
    "store",
    "types",
    "utils",
    "constants",
    "routes",
    "tests",
    "assets"  # Implied, not strictly banned
]

# Mapping of old directory patterns to new paths
# Format: (Regex pattern matching old relative path, Template for new relative path)
MAPPINGS = [
    # Router -> routes
    (r"^app[/\\]router(.*)$", r"routes\1"),
    (r"^app[/\\]guards(.*)$", r"routes/guards\1"),
    (r"^app[/\\]providers(.*)$", r"routes/providers\1"),

    # API -> api
    (r"^core[/\\]api(.*)$", r"api\1"),
    (r"^services(.*)$", r"api/services\1"),
    
    # Store -> store
    (r"^core[/\\]stores(.*)$", r"store\1"),
    (r"^stores(.*)$", r"store\1"),
    (r"^platform[/\\]context(.*)$", r"store/context\1"),
    
    # Components / Layouts -> components
    (r"^design_system(.*)$", r"components/common\1"),
    (r"^shared[/\\]components(.*)$", r"components/common\1"),
    (r"^layouts(.*)$", r"components/layouts\1"),
    (r"^platform[/\\]shell(.*)$", r"components/layouts/shell\1"),
    
    # Pages -> pages
    (r"^modules[/\\]([^/\\]+)[/\\]pages(.*)$", r"pages/\1\2"),
    (r"^features[/\\]([^/\\]+)[/\\]pages(.*)$", r"pages/\1\2"),
    (r"^pages(.*)$", r"pages\1"),
    
    # Utils
    (r"^core[/\\]utils(.*)$", r"utils\1"),
    (r"^utils(.*)$", r"utils\1"),
    (r"^core[/\\]theme(.*)$", r"utils/theme\1"),
    (r"^theme(.*)$", r"utils/theme\1"),
    (r"^core[/\\]i18n(.*)$", r"utils/i18n\1"),

    # Others that might just move content
    (r"^shared[/\\]utils(.*)$", r"utils\1"),
    (r"^shared[/\\]types(.*)$", r"types\1"),
    (r"^shared[/\\]constants(.*)$", r"constants\1"),
]

def map_path(old_rel_path):
    old_rel_path_str = old_rel_path.as_posix()
    
    for pattern, replacement in MAPPINGS:
        if re.match(pattern, old_rel_path_str):
            new_str = re.sub(pattern, replacement, old_rel_path_str)
            return Path(new_str)
            
    # Default to returning it as is if it's already in a mandated folder
    first_part = old_rel_path.parts[0]
    if first_part in MANDATED_FOLDERS or first_part.endswith(".tsx") or first_part.endswith(".ts"):
        return old_rel_path
        
    return None

def run_restructure():
    print("Starting F01 Frontend Restructure...")
    
    # Ensure mandated folders exist
    for folder in MANDATED_FOLDERS:
        (SRC_DIR / folder).mkdir(exist_ok=True, parents=True)
        
    # Find all files
    all_files = []
    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            all_files.append(Path(root) / f)
            
    moves = []
    
    for file_path in all_files:
        rel_path = file_path.relative_to(SRC_DIR)
        new_rel_path = map_path(rel_path)
        
        if new_rel_path and new_rel_path != rel_path:
            new_path = SRC_DIR / new_rel_path
            moves.append((file_path, new_path))
            
    # Execute Moves
    print(f"Found {len(moves)} files to move.")
    for old_p, new_p in moves:
        new_p.parent.mkdir(exist_ok=True, parents=True)
        shutil.move(str(old_p), str(new_p))
        print(f"Moved: {old_p.relative_to(SRC_DIR)} -> {new_p.relative_to(SRC_DIR)}")

    # Delete empty directories
    for root, dirs, files in os.walk(SRC_DIR, topdown=False):
        for d in dirs:
            dir_path = Path(root) / d
            if not any(dir_path.iterdir()):
                dir_path.rmdir()
                print(f"Removed empty dir: {dir_path.relative_to(SRC_DIR)}")
                
    # Update all alias imports to just @/ instead of @/ds, @/core, etc.
    # And replace older paths with new paths in import statements
    print("\nUpdating imports...")
    
    # We will just do a sweeping regex replacement for alias prefixes
    alias_replacements = [
        (r"@/ds/", r"@/components/common/"),
        (r"@/platform/shell/", r"@/components/layouts/shell/"),
        (r"@/platform/context/", r"@/store/context/"),
        (r"@/platform/", r"@/"), # Generic fallback
        (r"@/core/api/", r"@/api/"),
        (r"@/core/stores/", r"@/store/"),
        (r"@/core/utils/", r"@/utils/"),
        (r"@/core/theme/", r"@/utils/theme/"),
        (r"@/core/i18n/", r"@/utils/i18n/"),
        (r"@/core/", r"@/utils/"), # Generic fallback
        (r"@/modules/([^/]+)/pages/", r"@/pages/\1/"),
        (r"@/features/([^/]+)/pages/", r"@/pages/\1/"),
        (r"@/shared/components/", r"@/components/common/"),
        (r"@/shared/", r"@/"),
        (r"@/app/router/", r"@/routes/"),
        (r"@/app/guards/", r"@/routes/guards/"),
        (r"@/app/providers/", r"@/routes/providers/"),
        (r"@/stores/", r"@/store/"),
        (r"@/services/", r"@/api/services/"),
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
                except Exception as e:
                    print(f"Error updating imports in {file_path}: {e}")

    print("Restructure complete!")

if __name__ == "__main__":
    run_restructure()
