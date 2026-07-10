import re

v4_path = r'C:\PROJECT\yss_orbit\docs\YSS_Orbit_Implementation_Plan\YSS_Orbit_Final_Design_Document_V4.html'
with open(v4_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Fix the duplicate s24 id issue.
html = html.replace('<div class="section" id="s24">\n    <div class="section-header" onclick="toggleSection(\'s24\')">\n      <span class="section-num">24</span>\n      <div class="section-title-wrap">\n        <span class="section-tag tag-features">// App Store Roadmap</span>',
                    '<div class="section" id="s25">\n    <div class="section-header" onclick="toggleSection(\'s25\')">\n      <span class="section-num">25</span>\n      <div class="section-title-wrap">\n        <span class="section-tag tag-features">// App Store Roadmap</span>')

# Update sidebar
html = html.replace('onclick="openSection(\'s24\')" id="sb-s24"><span class="sb-num">24</span><span class="sb-txt">Implementation Plan</span></a>',
                    'onclick="openSection(\'s25\')" id="sb-s25"><span class="sb-num">25</span><span class="sb-txt">Implementation Plan</span></a>')

# Add 'open' class so it expands by default
html = html.replace('<div class="section" id="s25">', '<div class="section open" id="s25">')

with open(v4_path, 'w', encoding='utf-8') as f:
    f.write(html)
print('Fixed duplicate IDs!')
