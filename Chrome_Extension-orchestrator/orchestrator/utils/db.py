import os
from pathlib import Path

from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

def get_connection():
    database_url = (os.getenv("DATABASE_URL") or "").strip()
    connect_timeout = int(os.getenv("DB_CONNECT_TIMEOUT", "5") or 5)
    if database_url:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        return psycopg2.connect(database_url, connect_timeout=connect_timeout)

    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        connect_timeout=connect_timeout,
    )

def run_query(sql, params=None):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(sql, params or ())
    result = [dict(row) for row in cur.fetchall()]

    cur.close()
    conn.close()

    return result
