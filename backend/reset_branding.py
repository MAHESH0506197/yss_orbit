import os
import glob
from dotenv import load_dotenv
load_dotenv()
from django.core.wsgi import get_wsgi_application
from django.core.management import call_command

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
application = get_wsgi_application()

from django.db import connection

print("Dropping brand_configurations table...")
with connection.cursor() as cursor:
    cursor.execute('DROP TABLE IF EXISTS brand_configurations CASCADE;')

print("Deleting old migration files...")
for f in glob.glob('apps/branding/migrations/0*.py'):
    print(f"Deleting {f}")
    os.remove(f)

print("Making new migrations...")
call_command('makemigrations', 'branding')

print("Deleting migration records from DB...")
with connection.cursor() as cursor:
    cursor.execute("DELETE FROM django_migrations WHERE app='branding';")

print("Migrating...")
call_command('migrate', 'branding')
