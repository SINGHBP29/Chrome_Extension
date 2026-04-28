import os

from orchestrator.utils.db import get_connection


def main():
    required = [
        "DB_HOST",
        "DB_PORT",
        "DB_NAME",
        "DB_USER",
        "DB_PASSWORD",
        "GOOGLE_API_KEY",
    ]
    missing = [key for key in required if not os.getenv(key)]
    if missing:
        raise SystemExit(f"Missing env vars: {', '.join(missing)}")

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT 1;")
    row = cur.fetchone()
    cur.close()
    conn.close()

    if row != (1,):
        raise SystemExit(f"Unexpected database response: {row}")

    print("Smoke test passed: env vars loaded and PostgreSQL connection works.")


if __name__ == "__main__":
    main()
