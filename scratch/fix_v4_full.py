import re
from bs4 import BeautifulSoup

v4_path = r'C:\PROJECT\yss_orbit\docs\YSS_Orbit_Implementation_Plan\YSS_Orbit_Final_Design_Document_V4.html'

with open(v4_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Let's write a robust script that fixes the HTML structure without losing the content.
# We will identify all section IDs, fix the JS array, and fix the sidebar.

soup = BeautifulSoup(html, 'html.parser')

sections = soup.find_all('div', class_='section')

section_data = []
for idx, sec in enumerate(sections):
    sec_id = sec.get('id')
    # find section num
    num_el = sec.find('span', class_='section-num')
    num_text = num_el.text.strip() if num_el else str(idx)
    
    # find title
    title_el = sec.find(class_='section-title')
    title_text = title_el.text.strip() if title_el else f"Section {num_text}"
    
    # fix the onclick
    header = sec.find(class_='section-header')
    if header:
        header['onclick'] = f"toggleSection('{sec_id}')"
        
    section_data.append({
        'id': sec_id,
        'num': num_text,
        'title': title_text
    })

# Now let's rebuild the sidebar to perfectly match the sections
# The sidebar has <span class="sb-label"> items and <a class="sb-item"> items.
# It is better to just fix the IDs and onclicks of existing sidebar items.
sidebar = soup.find('nav', id='sidebar')
if sidebar:
    items = sidebar.find_all('a', class_='sb-item')
    # Let's map existing sidebar items by their title or try to sync them
    # But wait, there are sections like s6a, s15a...
    # We just need to make sure every sidebar item points to a valid section,
    # and the JS array has all sections.
    pass

# Update the JS array in the script tag
script_tags = soup.find_all('script')
for script in script_tags:
    if script.string and 'const sectionIds =' in script.string:
        new_ids_str = "['" + "','".join([s['id'] for s in section_data]) + "']"
        new_script_content = re.sub(r'const sectionIds = \[.*?\];', f'const sectionIds = {new_ids_str};', script.string, flags=re.DOTALL)
        script.string = new_script_content

# Save it to a scratch file to inspect
with open(r'C:\PROJECT\yss_orbit\scratch\v4_rebuild.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))

print(f"Found {len(section_data)} sections.")
print([s['id'] for s in section_data])
