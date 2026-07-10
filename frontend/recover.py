import json
import os

files_to_recover = ['ModuleDetailsPage.tsx', 'ModuleFormModal.tsx', 'ModuleViewModal.tsx', 'CreateSubscriptionWizard.tsx']
found = {}

with open(r'C:\Users\yarla\.gemini\antigravity\brain\7185d3cc-fb0d-4a82-919f-52a6c43ea282\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'PLANNER_RESPONSE':
                for tool in data.get('tool_calls', []):
                    if tool.get('name') == 'write_to_file':
                        target_file = tool.get('args', {}).get('TargetFile', '')
                        if any(fname in target_file for fname in files_to_recover):
                            # Clean up the path and content string
                            clean_path = target_file.replace('\\\\', '\\').strip('"')
                            # The CodeContent string is stored exactly as passed to the tool, so it might need literal unescaping
                            clean_content = tool['args']['CodeContent'].encode().decode('unicode_escape')
                            # Strip wrapping quotes if present
                            if clean_content.startswith('"') and clean_content.endswith('"'):
                                clean_content = clean_content[1:-1]
                            found[clean_path] = clean_content
        except Exception as e:
            pass

for path, content in found.items():
    print(f'Recovering: {path}')
    # Ensure directory exists
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as out:
        out.write(content)

print(f'Successfully recovered {len(found)} files.')
