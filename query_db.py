import sqlite3
import json
import sys

DB_PATH = r'C:\Users\ROG\.local\share\mimocode\mimocode.db'
conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
c = conn.cursor()

# 1. List tables
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in c.fetchall()]
print("=== TABLES ===")
for t in tables:
    print(t)

# 2. List recent sessions (last 7 days)
print("\n=== RECENT SESSIONS ===")
try:
    c.execute("""
        SELECT id, project_id, directory, title, time_created, time_updated
        FROM session
        ORDER BY time_created DESC
        LIMIT 20
    """)
    for r in c.fetchall():
        print(json.dumps(dict(r), default=str, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")

# 3. Check for sessions related to current project
print("\n=== SESSIONS IN CURRENT PROJECT DIR ===")
try:
    c.execute("""
        SELECT id, project_id, directory, title, time_created, time_updated
        FROM session
        WHERE directory LIKE '%复盘助手%' OR directory LIKE '%vibecoding%'
        ORDER BY time_created DESC
    """)
    for r in c.fetchall():
        print(json.dumps(dict(r), default=str, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")

# 4. Check tasks
print("\n=== RECENT TASKS ===")
try:
    c.execute("""
        SELECT t.id, t.session_id, t.title, t.status, t.time_created, t.time_updated
        FROM task t
        ORDER BY t.time_created DESC
        LIMIT 10
    """)
    for r in c.fetchall():
        print(json.dumps(dict(r), default=str, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")

conn.close()
