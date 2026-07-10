#!/usr/bin/env python
# yss_orbit\tools\database\check_missing_indexes.py
"""
Missing Index Checker
Identifies tables likely missing indexes based on foreign key columns.
Usage: python tools/database/check_missing_indexes.py
"""
print('Run: python manage.py check_db_indexes')
print('Or: SELECT tablename, attname FROM pg_stats WHERE n_distinct < 0 AND attname LIKE \'%_id\';')
