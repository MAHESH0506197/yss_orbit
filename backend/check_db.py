from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='organization_settings';")
    for row in cursor.fetchall():
        print(row)
