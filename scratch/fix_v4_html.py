import re

v4_path = r'C:\PROJECT\yss_orbit\docs\YSS_Orbit_Implementation_Plan\YSS_Orbit_Final_Design_Document_V4.html'
export_path = r'C:\PROJECT\yss_orbit\docs\YSS_Orbit_Implementation_Plan\implementation_plan_export.html'

with open(v4_path, 'r', encoding='utf-8') as f:
    v4_html = f.read()

with open(export_path, 'r', encoding='utf-8') as f:
    export_html = f.read()

# Fix Stack Mismatches
v4_html = v4_html.replace('Node.js · PostgreSQL · Redis · BullMQ', 'Django · DRF · PostgreSQL · Redis · Celery')
v4_html = v4_html.replace('Node.js · Stateless · Container', 'Django · Stateless · Container')
v4_html = v4_html.replace('Node.js', 'Django')

# Fix Architecture Monolith description
v4_html = v4_html.replace('Modular Monolith → Event-Driven Microservices', 'Core Platform + App Store Subscription Architecture')

# Extract markdown from export_html
md_match = re.search(r'<script type="text/markdown" id="markdown-content">\s*(.*?)\s*</script>', export_html, re.DOTALL)
md_content = md_match.group(1) if md_match else ''

# Convert basic markdown to HTML chunks for V4 layout
import html
escaped_md = html.escape(md_content)

new_section = f'''
<!-- ════════════════════ SECTION 24 — IMPLEMENTATION PLAN ════════════════════ -->
<div class="section" id="s24">
  <div class="section-header" onclick="toggleSection('s24')">
    <span class="section-num">24</span>
    <div class="section-title-wrap">
      <span class="section-tag tag-features">// App Store Roadmap</span>
      <h2 class="section-title">Implementation Plan (Modular Architecture)</h2>
    </div>
    <div class="section-toggle"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
  </div>
  <div class="section-body">
    <div class="intro-block">
      <strong>App Store Implementation Strategy</strong>
      This implementation plan supersedes all previous monolithic phase plans.
    </div>
    <div class="code-block">
      <pre><code>{escaped_md}</code></pre>
    </div>
  </div>
</div>
'''

# Insert new section at the end of <main class="content" id="main-content">
if '</main>' in v4_html:
    v4_html = v4_html.replace('</main>', new_section + '\n</main>')

# Update sidebar
sidebar_entry = '<a class="sb-item" onclick="openSection(\'s24\')" id="sb-s24"><span class="sb-num">24</span><span class="sb-txt">Implementation Plan</span></a>\n</nav>'
if '</nav>' in v4_html:
    v4_html = v4_html.replace('</nav>', sidebar_entry)

with open(v4_path, 'w', encoding='utf-8') as f:
    f.write(v4_html)

print('Updated V4 document successfully!')
