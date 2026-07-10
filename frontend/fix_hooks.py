# yss_orbit\frontend\fix_hooks.py
import os  
replacements = { 'useBatchtracking': 'useBatchTracking', 'useBusinessunit': 'useBusinessUnit', 'useDrugregister': 'useDrugRegister', 'useErrorlog': 'useErrorLog', 'useExpirytracking': 'useExpiryTracking', 'useFeatureflags': 'useFeatureFlags', 'useFilestorage': 'useFileStorage', 'useLeavemanagement': 'useLeaveManagement', 'useModuleregistry': 'useModuleRegistry', 'usePlatformadmin': 'usePlatformAdmin', 'useStocktransfer': 'useStockTransfer', 'useTenantmodule': 'useTenantModule' }  
for root, dirs, files in os.walk('src'):  
    for file in files:  
        if file.endswith('.ts') or file.endswith('.tsx'):  
            path = os.path.join(root, file)  
            with open(path, 'r', encoding='utf-8', errors='ignore') as f: content = f.read()  
            new_content = content  
            for k, v in replacements.items(): new_content = new_content.replace(k, v)  
            if new_content != content:  
                with open(path, 'w', encoding='utf-8') as f: f.write(new_content)  
