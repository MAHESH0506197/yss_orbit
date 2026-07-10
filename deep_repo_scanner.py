# yss_orbit\deep_repo_scanner.py
import os
import json
import ast
import re

def analyze_python_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if not content.strip():
            return "Empty"
            
        if "pass" in content and len(content.splitlines()) < 20:
            return "Stub"
            
        if "TODO" in content or "FIXME" in content or "implemented" in content.lower():
            return "Placeholder"
            
        try:
            tree = ast.parse(content)
            empty_count = 0
            total_count = 0
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                    total_count += 1
                    body = node.body
                    if len(body) == 1 and isinstance(body[0], ast.Pass):
                        empty_count += 1
                    elif len(body) == 1 and isinstance(body[0], ast.Expr) and isinstance(body[0].value, ast.Constant):
                        empty_count += 1
            if total_count > 0 and empty_count == total_count:
                return "Stub"
            elif empty_count > 0:
                return "Partial"
        except SyntaxError:
            return "Broken"
            
        return "Complete"
    except Exception as e:
        return "Broken"

def analyze_ts_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if not content.strip():
            return "Empty"
            
        if "TODO" in content or "FIXME" in content or "implemented" in content.lower() or "mock" in content.lower():
            return "Placeholder"
            
        if len(content.splitlines()) < 10 and not ("import" in content or "export" in content):
            return "Stub"
            
        return "Complete"
    except:
        return "Broken"

def scan_repo(base_dir):
    stats = {
        "backend": {"total": 0, "Complete": 0, "Partial": 0, "Stub": 0, "Placeholder": 0, "Empty": 0, "Broken": 0},
        "frontend": {"total": 0, "Complete": 0, "Partial": 0, "Stub": 0, "Placeholder": 0, "Empty": 0, "Broken": 0},
        "infrastructure": {"total": 0, "Complete": 0, "Partial": 0, "Stub": 0, "Placeholder": 0, "Empty": 0, "Broken": 0},
        "shared": {"total": 0, "Complete": 0, "Partial": 0, "Stub": 0, "Placeholder": 0, "Empty": 0, "Broken": 0},
        "other": {"total": 0, "Complete": 0, "Partial": 0, "Stub": 0, "Placeholder": 0, "Empty": 0, "Broken": 0}
    }
    
    file_statuses = []
    
    for root, dirs, files in os.walk(base_dir):
        if 'node_modules' in root or '.git' in root or '__pycache__' in root or 'venv' in root or '.next' in root:
            continue
            
        for file in files:
            if not (file.endswith('.py') or file.endswith('.ts') or file.endswith('.tsx') or file.endswith('.js') or file.endswith('.jsx') or file.endswith('.yaml') or file.endswith('.yml') or file.endswith('.tf') or file.endswith('.conf') or file.endswith('.sh')):
                continue
                
            filepath = os.path.join(root, file)
            rel_path = os.path.relpath(filepath, base_dir)
            
            category = "other"
            if rel_path.startswith("backend"): category = "backend"
            elif rel_path.startswith("frontend"): category = "frontend"
            elif rel_path.startswith("infrastructure") or rel_path.startswith("infra"): category = "infrastructure"
            elif rel_path.startswith("shared"): category = "shared"
            
            if file.endswith('.py'):
                status = analyze_python_file(filepath)
            elif file.endswith('.ts') or file.endswith('.tsx') or file.endswith('.js') or file.endswith('.jsx'):
                status = analyze_ts_file(filepath)
            else:
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if not content.strip():
                        status = "Empty"
                    elif "TODO" in content or "implemented" in content:
                        status = "Placeholder"
                    else:
                        status = "Complete"
                except:
                    status = "Broken"
                    
            stats[category]["total"] += 1
            stats[category][status] += 1
            
            if status != "Complete":
                file_statuses.append({
                    "file": rel_path,
                    "status": status,
                    "category": category
                })

    with open('deep_audit_results.json', 'w') as f:
        json.dump({"stats": stats, "incomplete_files": file_statuses}, f, indent=2)

if __name__ == "__main__":
    scan_repo(r"c:\PROJECT\yss_orbit")
