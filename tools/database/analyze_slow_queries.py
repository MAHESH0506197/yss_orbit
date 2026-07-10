#!/usr/bin/env python
# yss_orbit\tools\database\analyze_slow_queries.py
"""
Slow Query Analyzer
Analyzes pg_stat_statements for slow queries above threshold.
Usage: python tools/database/analyze_slow_queries.py
"""
THRESHOLD_MS = 200
print(f'Queries slower than {THRESHOLD_MS}ms:')
print('SELECT query, mean_exec_time, calls FROM pg_stat_statements WHERE mean_exec_time > %s ORDER BY mean_exec_time DESC LIMIT 20;' % THRESHOLD_MS)
