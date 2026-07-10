import re

v4_path = r'C:\PROJECT\yss_orbit\docs\YSS_Orbit_Implementation_Plan\YSS_Orbit_Final_Design_Document_V4.html'

with open(v4_path, 'r', encoding='utf-8') as f:
    v4_html = f.read()

# The script tags we need to inject into <head>
scripts_to_inject = """
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad: false, theme: 'default' });
  
  document.addEventListener('DOMContentLoaded', async () => {
    const mdEl = document.getElementById('markdown-plan-content');
    if (mdEl) {
        let mdText = mdEl.textContent;
        let parsedHtml = marked.parse(mdText);
        parsedHtml = parsedHtml.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g, '<div class="mermaid">$1</div>');
        
        // Add v4 specific styling to some elements
        parsedHtml = parsedHtml.replace(/<h1>/g, '<h3 style="font-size:20px; font-weight:600; color:var(--text); margin-top:24px; margin-bottom:12px;">');
        parsedHtml = parsedHtml.replace(/<h2>/g, '<h4 style="font-size:16px; font-weight:600; color:var(--text); margin-top:20px; margin-bottom:10px;">');
        parsedHtml = parsedHtml.replace(/<h3>/g, '<h5 style="font-size:14px; font-weight:600; color:var(--text); margin-top:16px; margin-bottom:8px;">');
        parsedHtml = parsedHtml.replace(/<ul>/g, '<ul style="padding-left:20px; color:var(--muted); margin-bottom:16px;">');
        parsedHtml = parsedHtml.replace(/<p>/g, '<p style="color:var(--muted); margin-bottom:12px; line-height:1.7;">');
        
        document.getElementById('plan-rendered-content').innerHTML = parsedHtml;
        await mermaid.run({
          nodes: document.querySelectorAll('.mermaid'),
        });
    }
  });
</script>
<style>
  .mermaid { text-align: center; margin: 20px 0; background: var(--bg2); padding: 20px; border-radius: 8px; border: 1px solid var(--border2); }
  #plan-rendered-content { font-size: 14px; }
  #plan-rendered-content pre { background: #1e2433; padding: 16px; border-radius: 8px; color: #cdd6f4; overflow-x: auto; margin-bottom: 16px; }
  #plan-rendered-content code { font-family: var(--mono); }
</style>
"""

if "marked.min.js" not in v4_html:
    v4_html = v4_html.replace('</head>', scripts_to_inject + '\n</head>')

# Replace the inner code block of s24 with the renderer elements
# We need to find the old <pre><code>...</code></pre> and extract the markdown inside it.
import html
match = re.search(r'<div class="section" id="s24">.*?(<pre><code>(.*?)</pre>).*?</div>\s*(?=<!--|<script|</main|</div>\n<footer)', v4_html, re.DOTALL)
if match:
    full_pre_block = match.group(1)
    escaped_md = match.group(2)
    # Unescape the markdown
    raw_md = html.unescape(escaped_md)
    
    # We will replace the full_pre_block with our dynamic div and script
    new_content = f"""
    <div id="plan-rendered-content" style="padding: 10px 20px;"></div>
    <script type="text/markdown" id="markdown-plan-content">{raw_md}</script>
    """
    v4_html = v4_html.replace(full_pre_block, new_content)

with open(v4_path, 'w', encoding='utf-8') as f:
    f.write(v4_html)

print("Updated rendering of s24!")
