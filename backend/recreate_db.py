import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

con = psycopg2.connect(dbname='postgres', user='postgres', password='Asha1208', host='localhost', port='5432')
con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
cur = con.cursor()

# Terminate existing connections to the database to allow dropping
cur.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'YSS_ORBIT_DB';")

try:
    cur.execute('DROP DATABASE "YSS_ORBIT_DB";')
    print('Dropped database')
except Exception as e:
    print('Drop error:', e)

try:
    cur.execute('CREATE DATABASE "YSS_ORBIT_DB";')
    print('Created database')
except Exception as e:
    print('Create error:', e)

cur.close()
con.close()
