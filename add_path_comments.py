# yss_orbit\add_path_comments.py
import os
import sys

def get_comment_string(ext, path):
    ext = ext.lower()
    if ext in ['.py', '.sh', '.yaml', '.yml', '.toml', '.env', '.gitignore', '.rb', '.ps1', '.ini', '.conf', '.cfg', '.dockerfile', 'dockerfile', '.mk', 'makefile', '.graphql', '.txt', '.txt', '.csv']:
        return f"# {path}"
    elif ext in ['.js', '.jsx', '.ts', '.tsx', '.c', '.cpp', '.h', '.hpp', '.java', '.go', '.rs', '.swift', '.kt', '.php']:
        return f"// {path}"
    elif ext in ['.css', '.scss', '.less']:
        return f"/* {path} */"
    elif ext in ['.html', '.xml', '.svg', '.vue', '.svelte', '.md']:
        return f"<!-- {path} -->"
    elif ext in ['.sql']:
        return f"-- {path}"
    elif ext in ['.bat', '.cmd']:
        return f"REM {path}"
    elif ext in ['.json']:
        # JSON does not support comments natively, but if forced, we skip to avoid breaking syntax
        return None
    else:
        # Default to generic comment //
        return f"// {path}"

def main():
    root_dir = r"C:\PROJECT\yss_orbit"
    # Directories to ignore to prevent breaking standard modules, binaries, or git
    ignore_dirs = {'.git', '__pycache__', 'node_modules', 'venv', 'env', '.venv', '.idea', '.vscode', 'dist', 'build', '.next'}
    
    for subdir, dirs, files in os.walk(root_dir):
        # Filter directories in-place
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        for file in files:
            # Check if file is a binary file or an image, etc.
            ext = os.path.splitext(file)[1].lower()
            if ext in ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.pyc', '.exe', '.dll', '.bin', '.dat', '.pkl']:
                continue
            
            # Map extensions for files with no standard extension dot
            effective_ext = ext
            if not effective_ext:
                if file.lower() == 'dockerfile':
                    effective_ext = '.dockerfile'
                elif file.lower() == 'makefile':
                    effective_ext = '.mk'
                elif file.startswith('.env'):
                    effective_ext = '.env'
            
            filepath = os.path.join(subdir, file)
            
            # Calculate the relative path from yss_orbit's parent
            # yss_orbit is C:\PROJECT\yss_orbit
            # we want the path starting with "yss_orbit\"
            rel_path = os.path.relpath(filepath, os.path.dirname(root_dir))
            
            comment_line = get_comment_string(effective_ext, rel_path)
            
            if comment_line is None:
                print(f"Skipping {filepath} (unsupported format for comments e.g. json)")
                continue
                
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                # Binary or non-utf-8 file, skip
                print(f"Skipping {filepath} (binary or non-UTF-8)")
                continue
            except Exception as e:
                print(f"Failed to read {filepath}: {e}")
                continue
                
            lines = content.split('\n')
            
            # Avoid duplicating if already present
            if any(comment_line in line for line in lines[:5]):
                print(f"Skipping {filepath}, already contains comment")
                continue
                
            # Handle shebang
            if lines and lines[0].startswith('#!'):
                lines.insert(1, comment_line)
            else:
                lines.insert(0, comment_line)
                
            new_content = '\n'.join(lines)
            
            try:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
            except Exception as e:
                print(f"Failed to write {filepath}: {e}")

if __name__ == "__main__":
    main()
