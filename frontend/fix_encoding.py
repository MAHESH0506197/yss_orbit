import os

replacements = {
    'â€”': '—',
    'â€¢': '•',
    'â€¦': '…',
    'â† ': '←',
    'â”€': '─',
    'â• ': '═'
}

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if not file.endswith(('.ts', '.tsx', '.js', '.jsx', '.css', '.html')):
                continue
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception:
                continue
            
            modified = False
            for bad, good in replacements.items():
                if bad in content:
                    content = content.replace(bad, good)
                    modified = True
            
            if modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'Fixed {filepath}')

process_directory('src')
