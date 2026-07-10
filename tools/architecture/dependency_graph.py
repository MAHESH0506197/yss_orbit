#!/usr/bin/env python
# yss_orbit\tools\architecture\dependency_graph.py
"""
Module Dependency Graph Generator
Generates a dependency graph for all platform modules.
Usage: python tools/architecture/dependency_graph.py
"""
import os, json

def generate_graph():
    apps_path = os.path.join('backend', 'apps')
    apps = [d for d in os.listdir(apps_path) if os.path.isdir(os.path.join(apps_path, d))]
    graph = {app: [] for app in sorted(apps)}
    print(json.dumps(graph, indent=2))
    print(f'\nTotal apps: {len(apps)}')

if __name__ == '__main__':
    generate_graph()
