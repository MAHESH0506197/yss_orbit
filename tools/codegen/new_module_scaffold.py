#!/usr/bin/env python
"""
Frontend Module Scaffold Generator
Creates a complete standard frontend module skeleton.
Usage: python tools/codegen/new_module_scaffold.py <module_name>
"""
import os, sys

SUBDIRS = ['api', 'components', 'constants', 'hooks', 'pages', 'routes', 'services', 'state', 'tests', 'types', 'utils']

def scaffold(module_name):
    base = os.path.join('frontend', 'src', 'modules', module_name)
    if os.path.exists(base):
        print(f'Module {module_name} already exists. Aborting.')
        sys.exit(1)
    for d in SUBDIRS:
        os.makedirs(os.path.join(base, d), exist_ok=True)
    with open(os.path.join(base, 'index.ts'), 'w') as f:
        f.write(f'// {module_name} Module — barrel export\n')
    print(f'Scaffolded: frontend/src/modules/{module_name}/')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python new_module_scaffold.py <module_name>')
        sys.exit(1)
    scaffold(sys.argv[1])
