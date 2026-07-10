import os
import re

utils_dir = r'C:\PROJECT\yss_orbit\frontend\src\utils'
date_ts_path = os.path.join(utils_dir, 'date.ts')

new_date_ts = """import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Format a date string or Date object to IST (Asia/Kolkata)
 */
export function formatIST(dateStr: string | Date | null | undefined, formatStr: string = 'PP pp') {
  if (!dateStr) return '—';
  
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return formatInTimeZone(date, 'Asia/Kolkata', formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return String(dateStr);
  }
}
"""

with open(date_ts_path, 'w', encoding='utf-8') as f:
    f.write(new_date_ts)

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='latin1') as f:
            content = f.read()

    original_content = content

    # 1. Check if 'format' is imported from 'date-fns'
    if not re.search(r'import\s+{[^}]*\bformat\b[^}]*}\s+from\s+[\'"`]date-fns[\'"`]', content):
        return

    # 2. Add import for formatIST from @/utils/date
    if 'formatIST' not in content:
        # Find the last import statement
        last_import = [m for m in re.finditer(r'^import .*?;$', content, re.MULTILINE)]
        if last_import:
            insert_pos = last_import[-1].end()
            content = content[:insert_pos] + "\nimport { formatIST } from '@/utils/date';" + content[insert_pos:]
        else:
            content = "import { formatIST } from '@/utils/date';\n" + content
            
    # 3. Replace format(new Date(...), ...) with formatIST(..., ...)
    # Pattern for format(new Date(val), 'fmt')
    content = re.sub(r'format\(\s*new Date\((.*?)\)\s*,\s*([\'"`].*?[\'"`])\s*\)', r'formatIST(\1, \2)', content)
    
    # Replace format(val, 'fmt')
    content = re.sub(r'format\(\s*(.*?)\s*,\s*([\'"`].*?[\'"`])\s*\)', r'formatIST(\1, \2)', content)

    # 4. Remove 'format' from 'date-fns' import
    def repl_import(m):
        imports = m.group(1).replace(' ', '').split(',')
        if 'format' in imports:
            imports.remove('format')
        if not imports:
            return '' # remove whole line
        return 'import { ' + ', '.join(imports) + ' } from \'date-fns\';'

    content = re.sub(r'import\s+{([^}]+)}\s+from\s+[\'"`]date-fns[\'"`];?', repl_import, content)
    
    # Fix double blank lines at top
    content = re.sub(r'^\n+', '', content)
    content = re.sub(r'\n{3,}', '\n\n', content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {filepath}')

src_dir = r'C:\PROJECT\yss_orbit\frontend\src'
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')) and file != 'date.ts':
            process_file(os.path.join(root, file))

print('Done')
