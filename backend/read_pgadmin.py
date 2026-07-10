# yss_orbit\backend\read_pgadmin.py
import sqlite3
import os

db_path = os.path.expandvars(r"%APPDATA%\pgAdmin\pgadmin4.db")
if os.path.exists(db_path):
    print("Found pgadmin4.db at:", db_path)
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # List tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        print("Tables:", tables)
        
        if "server" in tables:
            # Query servers
            cursor.execute("SELECT id, name, host, port, username, password FROM server;")
            servers = cursor.fetchall()
            print("\nServers found:")
            for s in servers:
                print(f"ID: {s[0]}, Name: {s[1]}, Host: {s[2]}, Port: {s[3]}, User: {s[4]}")
                if s[5]:
                    print("  Password hash/encrypted present")
                else:
                    print("  No password saved")
        conn.close()
    except Exception as e:
        print("Error reading database:", e)
else:
    print("pgadmin4.db not found")
