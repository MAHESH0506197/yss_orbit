import os
import difflib

def get_directories(base_path):
    dirs = []
    for root, dnames, _ in os.walk(base_path):
        # Exclude node_modules, .git, venv, etc
        if 'node_modules' in root or '.git' in root or '__pycache__' in root or '.venv' in root:
            continue
        for d in dnames:
            if d not in ['node_modules', '.git', '__pycache__', '.venv']:
                dirs.append(os.path.join(root, d))
    return dirs

def find_similar_folders(base_path):
    print(f"Scanning {base_path} for similar folders...")
    dirs = get_directories(base_path)
    
    # Extract just the folder names, mapped to their full paths
    folder_map = {}
    for d in dirs:
        name = os.path.basename(d).lower()
        if name not in folder_map:
            folder_map[name] = []
        folder_map[name].append(d)
        
    unique_names = list(folder_map.keys())
    
    suspects = []
    
    for i in range(len(unique_names)):
        for j in range(i + 1, len(unique_names)):
            name1 = unique_names[i]
            name2 = unique_names[j]
            
            # Check for singular/plural or very high similarity
            if name1 + 's' == name2 or name2 + 's' == name1 or name1 + 'es' == name2 or name2 + 'es' == name1:
                suspects.append((name1, name2))
                
    for n1, n2 in suspects:
        print(f"\nFound potential duplicate pair: '{n1}' and '{n2}'")
        for path in folder_map[n1]:
            print(f"  - {path}")
        for path in folder_map[n2]:
            print(f"  - {path}")

if __name__ == '__main__':
    find_similar_folders(r'c:\PROJECT\yss_orbit\frontend\src')
    find_similar_folders(r'c:\PROJECT\yss_orbit\backend\apps')
