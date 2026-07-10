# yss_orbit\frontend\check_pages.py
import os, glob  
files = glob.glob('src/modules/**/*.tsx', recursive=True)  
for f in files:  
    if 'ListPage' in f or 'Page' in f:  
        with open(f, 'r', encoding='utf-8') as file: content = file.read()  
        if 'useEffect' in content and 'fetch' in content: print(f'--- {f} ---'); print('\n'.join(content.split('\n')[:15]))  
