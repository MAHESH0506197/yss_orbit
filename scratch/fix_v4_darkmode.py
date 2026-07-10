import re

v4_path = r'C:\PROJECT\yss_orbit\docs\YSS_Orbit_Implementation_Plan\YSS_Orbit_Final_Design_Document_V4.html'
with open(v4_path, 'r', encoding='utf-8') as f:
    html = f.read()

# We need to remove the `<div class="code-block">` that surrounds `<div id="plan-rendered-content" ...>`
# Let's use regex to find it and remove the wrapper
html = re.sub(r'<div class="code-block">\s*(<div id="plan-rendered-content".*?</div>)\s*</div>', r'\1', html, flags=re.DOTALL)

# But wait, there is also the `<script type="text/markdown" id="markdown-plan-content">` inside the code block?
# Let's just remove the `.code-block` class if it's right above plan-rendered-content.
# Or better, just replace `<div class="code-block">` with `<div class="markdown-body">` in that specific section.

match = re.search(r'<div class="section open" id="s25">.*?(<div class="code-block">.*?)</div>\s*</div>\s*<!--', html, re.DOTALL)
# Actually, it's safer to just replace `<div class="code-block">\n      <div id="plan-rendered-content"`
html = html.replace('<div class="code-block">\n        \n      <div id="plan-rendered-content"', '<div>\n      <div id="plan-rendered-content"')
html = html.replace('<div class="code-block">\n      <div id="plan-rendered-content"', '<div>\n      <div id="plan-rendered-content"')
html = html.replace('<div class="code-block">        \n      <div id="plan-rendered-content"', '<div>\n      <div id="plan-rendered-content"')

# Let's be aggressive with regex:
html = re.sub(r'<div class="code-block">(\s*<div id="plan-rendered-content")', r'<div>\1', html)

# Let's also ensure the <p> tags have a better color if they were hardcoded, but `--muted` is fine on a light background.
# Because the background will now be the light background of the section body.

with open(v4_path, 'w', encoding='utf-8') as f:
    f.write(html)
print('Fixed dark mode issue!')
