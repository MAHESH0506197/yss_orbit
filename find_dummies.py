# yss_orbit\find_dummies.py
﻿import os
import json

apps = ['jobs', 'webhooks', 'integration', 'api_consumer_key', 'error_log', 'events', 'outbox', 'orchestration', 'inventory', 'pos', 'customers', 'retail_billing']
implemented_indicators = [
    'assert True',
    'pass',
    'urlpatterns = [\n]',
    'urlpatterns = []',
    'class DefaultModel(models.Model):',
    'class DefaultSerializer(serializers.Serializer):',
    'class DefaultView(APIView):',
    'def test_example',
    'return None',
]

res = []
for a in apps:
    p = os.path.join('backend', 'apps', a)
    if not os.path.exists(p): continue
    for r, d, f in os.walk(p):
        for file in f:
            if file.endswith('.py') and file != '__init__.py':
                path = os.path.join(r, file)
                try:
                    content = open(path, 'r', encoding='utf-8').read()
                    if any(ind in content for ind in implemented_indicators) or len(content.strip()) == 0:
                        res.append(path)
                except Exception as e:
                    pass

with open('real_empty_files.json', 'w') as f:
    json.dump(res, f, indent=2)
