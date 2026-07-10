#!/usr/bin/env python
# yss_orbit\tools\codegen\new_backend_app_scaffold.py
"""
Backend App Scaffold Generator
Creates a complete standard Django app skeleton.
Usage: python tools/codegen/new_backend_app_scaffold.py <app_name>
"""
import os, sys

SUBDIRS = [
    'api/serializers', 'api/views', 'constants', 'enums', 'events',
    'management/commands', 'migrations', 'models', 'orchestrators',
    'permissions', 'repositories', 'selectors', 'services', 'tasks',
    'tests', 'validators',
]

def scaffold(app_name):
    base = os.path.join('backend', 'apps', app_name)
    if os.path.exists(base):
        print(f'App {app_name} already exists. Aborting.')
        sys.exit(1)
    for d in SUBDIRS:
        full = os.path.join(base, d)
        os.makedirs(full, exist_ok=True)
        open(os.path.join(full, '__init__.py'), 'w').close()
    for d in ['api', 'management']:
        open(os.path.join(base, d, '__init__.py'), 'w').close()
    # Root files
    for fn, content in [('__init__.py', ''), ('admin.py', 'from django.contrib import admin\n'),
                         ('apps.py', f'from django.apps import AppConfig\n\nclass {app_name.title().replace("_","")}Config(AppConfig):\n    default_auto_field = "django.db.models.BigAutoField"\n    name = "apps.{app_name}"\n'),
                         ('urls.py', 'from django.urls import path\n\nurlpatterns = []\n'),
                         (f'events/events.py', '# Domain events\n'),
                         (f'events/event_handlers.py', '# Event handlers\n')]:
        with open(os.path.join(base, fn), 'w') as f:
            f.write(content)
    print(f'Scaffolded: backend/apps/{app_name}/')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python new_backend_app_scaffold.py <app_name>')
        sys.exit(1)
    scaffold(sys.argv[1])
