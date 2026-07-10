# yss_orbit\frontend\fix_pages.py
import re
import glob

files = glob.glob('src/modules/**/*.tsx', recursive=True)
for f in files:
    with open(f, 'r', encoding='utf-8', errors='ignore') as file:
        c = file.read()
    
    # 1. Capture the fetcher name, extra destructured items, and the hook name
    # e.g., const { fetchLogs, loading } = useAudit();
    # e.g., const { fetchModules, toggleModule, loading } = useModuleRegistry();
    def repl_hook(m):
        fetcher = m.group(1)
        extras = m.group(2) or ''
        hook = m.group(3)
        return f'const {{ data, loading{extras} }} = {hook}();'
        
    c = re.sub(r'const {\s*(fetch[a-zA-Z0-9_]+)((?:,\s*[a-zA-Z0-9_]+)*),\s*loading\s*} = (use[a-zA-Z0-9_]+)\(\);', repl_hook, c)
    
    # 2. Replace the useState with a simple assignment
    c = re.sub(r'const \[([a-zA-Z0-9_]+), set[a-zA-Z0-9_]+\] = useState<[^>]+>\(\[\]\);', r'const \1 = (data || []) as any;', c)
    c = re.sub(r'const \[([a-zA-Z0-9_]+), set[a-zA-Z0-9_]+\] = useState<any\[\]>\(\[\]\);', r'const \1 = (data || []) as any;', c)

    # 3. Remove the useEffect block
    c = re.sub(r'useEffect\(\(\) => \{\s*fetch[a-zA-Z0-9_]+\(\)\.then\([^)]+\)\.catch\([^)]+\);\s*\}, \[\]\);', '', c)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(c)
