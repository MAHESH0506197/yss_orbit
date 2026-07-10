import os
import re

src_dir = r'C:\PROJECT\yss_orbit\frontend\src'

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return

    original_content = content
    
    if 'toLocaleDateString' not in content and 'toLocaleTimeString' not in content and 'toLocaleString' not in content:
        return

    def repl_date(m):
        return f"formatIST({m.group(1)}, 'PPP')"
        
    def repl_time(m):
        return f"formatIST({m.group(1)}, 'pp')"
        
    def repl_string(m):
        return f"formatIST({m.group(1)}, 'PP pp')"

    pattern_date = r'(new Date\([^)]*\)|[a-zA-Z0-9_?.]+)\.toLocaleDateString\([^)]*\)'
    content = re.sub(pattern_date, repl_date, content)
    
    pattern_time = r'(new Date\([^)]*\)|[a-zA-Z0-9_?.]+)\.toLocaleTimeString\([^)]*\)'
    content = re.sub(pattern_time, repl_time, content)
    
    pattern_string = r'(new Date\([^)]*\)|[a-zA-Z0-9_?.]+)\.toLocaleString\([^)]*\)'
    content = re.sub(pattern_string, repl_string, content)

    if content != original_content:
        # add import if needed
        if 'formatIST' not in original_content:
            last_import = [m for m in re.finditer(r'^import .*?;$', content, re.MULTILINE)]
            if last_import:
                insert_pos = last_import[-1].end()
                content = content[:insert_pos] + "\nimport { formatIST } from '@/utils/date';" + content[insert_pos:]
            else:
                content = "import { formatIST } from '@/utils/date';\n" + content
                
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {filepath}')

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            process_file(os.path.join(root, file))

print('Done')
