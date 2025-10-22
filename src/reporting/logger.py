import sqlite3
import datetime
import os

class Logger:
    def __init__(self, db_path=None):
        # Allow overriding DB path via env var
        if db_path is None:
            db_path = os.getenv("RESULTS_DB", "data/results.db")
        # Ensure DB directory exists for containerized runs
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.conn = sqlite3.connect(db_path)
        self.create_table()

    def create_table(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                test_type TEXT,
                status TEXT,
                details TEXT
            )
        """)
        self.conn.commit()

    def log_result(self, test_type, status, details):
        timestamp = datetime.datetime.now().isoformat()
        self.conn.execute(
            "INSERT INTO results (timestamp, test_type, status, details) VALUES (?, ?, ?, ?)",
            (timestamp, test_type, status, details)
        )
        self.conn.commit()

    def close(self):
        self.conn.close()
