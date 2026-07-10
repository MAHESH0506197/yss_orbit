# yss_orbit\backend\fix_sse_views.py
import re

def fix_sse_views():
    path = r"c:\PROJECT\yss_orbit\backend\apps\notification\sse_views.py"
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The issue is things like:
    # yield f"retry: {reconnect_ms}
    # "
    # We want to replace it with:
    # yield f"retry: {reconnect_ms}\n"
    
    # Let's just fix it by replacing the bad strings with the good ones.
    content = content.replace('yield f"retry: {reconnect_ms}\n"', 'yield f"retry: {reconnect_ms}\\n"')
    content = content.replace('yield f"event: connected\n"', 'yield f"event: connected\\n"')
    content = content.replace('yield f"data: {json.dumps({\'status\': \'connected\', \'user_id\': str(user_id), \'business_unit_id\': str(business_unit_id)})}\n\n"', 'yield f"data: {json.dumps({\'status\': \'connected\', \'user_id\': str(user_id), \'business_unit_id\': str(business_unit_id)})}\\n\\n"')
    
    content = content.replace('yield ": keepalive\n\n"', 'yield ": keepalive\\n\\n"')
    
    content = content.replace('yield f"event: notification\n"', 'yield f"event: notification\\n"')
    content = content.replace('yield f"data: {data}\n\n"', 'yield f"data: {data}\\n\\n"')
    
    content = content.replace('yield f"event: error\n"', 'yield f"event: error\\n"')
    content = content.replace('yield f"data: {json.dumps({\'error\': \'Stream interrupted. Reconnecting...\'})}\n\n"', 'yield f"data: {json.dumps({\'error\': \'Stream interrupted. Reconnecting...\'})}\\n\\n"')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
        print("Fixed sse_views.py")

if __name__ == "__main__":
    fix_sse_views()
