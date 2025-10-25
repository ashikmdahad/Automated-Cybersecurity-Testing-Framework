import sqlite3
import os

def generate_report(db_path=None):
    if db_path is None:
        db_path = os.getenv("RESULTS_DB", "data/results.db")
    report = ["# Vulnerability Test Report\n"]
    if not os.path.exists(db_path):
        report.append("No results yet. Run a scan to populate data.\n")
        return "\n".join(report)
    conn = sqlite3.connect(db_path)
    try:
        cursor = conn.cursor()
        # Findings summary
        cursor.execute("SELECT timestamp, status, details FROM results WHERE test_type='finding' ORDER BY id DESC")
        findings = cursor.fetchall()
        if findings:
            report.append("\n## Findings Summary\n")
            for ts, severity, details in findings:
                report.append(f"- [{severity.upper()}] {ts} — {details}\n")

        cursor.execute("SELECT * FROM results WHERE test_type!='finding'")
        results = cursor.fetchall()
        if not results and not findings:
            report.append("No results yet. Run a scan to populate data.\n")
        else:
            for row in results:
                report.append(f"- Test ID: {row[0]} | Timestamp: {row[1]} | Type: {row[2]} | Status: {row[3]} | Details: {row[4]}\n")
                report.append("  Remediation: Implement validation and encryption for CAN packets.\n")
        return "\n".join(report)
    finally:
        conn.close()
