import re

v4_path = r'C:\PROJECT\yss_orbit\docs\YSS_Orbit_Implementation_Plan\YSS_Orbit_Final_Design_Document_V4.html'
with open(v4_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update sectionIds array to include s24 and s25
# Find the array using regex and replace it
match = re.search(r'const sectionIds = \[(.*?)\];', html, re.DOTALL)
if match:
    # Instead of replacing precisely, let's just make sure s24 and s25 are in it
    inner = match.group(1)
    if "'s24'" not in inner:
        inner = inner + ",'s24'"
    if "'s25'" not in inner:
        inner = inner + ",'s25'"
    html = html[:match.start(1)] + inner + html[match.end(1):]

# 2. Make all sections visible by default
# Replace <div class="section" id="sX"> with <div class="section open" id="sX">
# But only if it doesn't already have 'open'
html = re.sub(r'<div class="section"\s+id="', '<div class="section open" id="', html)

# 3. Fix the rendering block styling for markdown so it's perfectly visible
# We added this block previously:
html = html.replace('<h3 style="font-size:20px;', '<h3 style="font-size:18px;')
html = html.replace('<h4 style="font-size:16px;', '<h4 style="font-size:15px;')

with open(v4_path, 'w', encoding='utf-8') as f:
    f.write(html)
print('Fixed array and made sections visible by default!')
