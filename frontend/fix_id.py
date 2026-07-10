# yss_orbit\frontend\fix_id.py
import glob  
for f in glob.glob('src/modules/**/*.tsx', recursive=True):  
    with open(f, 'r', encoding='utf-8') as file: c = file.read()  
    new_c = c.replace('id: number', 'id: any')  
    if new_c != c:  
        with open(f, 'w', encoding='utf-8') as file: file.write(new_c)  
