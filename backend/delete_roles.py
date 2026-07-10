from django.db import connection, transaction
with transaction.atomic():
    with connection.cursor() as cursor:
        cursor.execute("TRUNCATE rbac_roles CASCADE")
print("Deleted all roles!")
