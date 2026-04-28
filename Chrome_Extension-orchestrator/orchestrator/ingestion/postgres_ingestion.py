import os
import random
from collections import defaultdict
from contextlib import closing
from urllib.parse import unquote, urlparse

import psycopg2
from psycopg2 import errorcodes
from psycopg2 import sql

from orchestrator.utils.db import get_connection

FIRST_NAMES = [
    "Aman", "Riya", "Karan", "Sneha", "Rahul", "Anjali", "Vikram", "Neha", "Arjun",
    "Pooja", "Aditi", "Nikhil", "Ishita", "Rohit", "Priya", "Sahil", "Diya", "Mihir",
    "Tanvi", "Harsh", "Meera", "Yash", "Kriti", "Akash", "Sanya",
]
LAST_NAMES = [
    "Sharma", "Verma", "Mehta", "Iyer", "Singh", "Gupta", "Rao", "Nair", "Kapoor",
    "Das", "Patel", "Reddy", "Bose", "Joshi", "Pillai", "Mishra", "Chopra", "Kulkarni",
]
DEPARTMENTS = [
    "Java Backend", "Python Full Stack", "Data Scientist", "UI/UX", "DevOps",
    "QA Automation", "Operations", "HR", "TA", "Finance",
]
DESIGNATIONS = ["T0", "T1", "T2", "T3", "T4"]
LOCATIONS = ["Bangalore", "Hyderabad", "Chennai"]
EMPLOYMENT_TYPES = ["Full Time", "Intern"]
CLIENTS = ["Pepsi", "Visa", "Google", "Nike", "Ford", "Apple"]
DEPARTMENT_WEIGHTS = [18, 18, 12, 10, 12, 8, 8, 6, 4, 4]
LOCATION_WEIGHTS = [50, 30, 20]
DESIGNATION_WEIGHTS = [4, 34, 28, 22, 12]
TYPE_WEIGHTS = [82, 18]


def connect_db():
    return get_connection()

def _admin_connection_params():
    database_url = (os.getenv("DATABASE_URL") or "").strip()
    if database_url:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)

        parsed = urlparse(database_url)
        db_name = parsed.path.lstrip("/") or os.getenv("DB_NAME")
        return {
            "host": parsed.hostname or os.getenv("DB_HOST"),
            "port": parsed.port or os.getenv("DB_PORT", "5432"),
            "user": unquote(parsed.username) if parsed.username else os.getenv("DB_USER"),
            "password": unquote(parsed.password) if parsed.password else os.getenv("DB_PASSWORD"),
            "db_name": db_name,
        }

    return {
        "host": os.getenv("DB_HOST"),
        "port": os.getenv("DB_PORT", "5432"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "db_name": os.getenv("DB_NAME"),
    }


def ensure_database_exists():
    try:
        with closing(connect_db()):
            return
    except psycopg2.OperationalError as exc:
        message = str(exc).lower()
        missing_db = (
            getattr(exc, "pgcode", None) == errorcodes.INVALID_CATALOG_NAME
            or "does not exist" in message
        )
        if not missing_db:
            raise

    admin_name = os.getenv("PGMAINTENANCE_DB", "postgres")
    params = _admin_connection_params()
    db_name = params["db_name"]
    if not db_name:
        raise RuntimeError("Missing DB_NAME (or DATABASE_URL).")
    with closing(psycopg2.connect(
        host=params["host"],
        port=params["port"],
        dbname=admin_name,
        user=params["user"],
        password=params["password"],
    )) as admin_conn:
        admin_conn.autocommit = True
        with admin_conn.cursor() as cursor:
            try:
                cursor.execute(
                    sql.SQL("CREATE DATABASE {}").format(
                        sql.Identifier(db_name)
                    )
                )
            except psycopg2.errors.DuplicateDatabase:
                pass


def create_table(conn):
    with conn.cursor() as cursor:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS employees (
                employee_id VARCHAR(20) PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                department TEXT NOT NULL,
                designation TEXT NOT NULL,
                location TEXT NOT NULL,
                type TEXT NOT NULL,
                client TEXT NOT NULL
            );
            """
        )
        cursor.execute("ALTER TABLE employees ADD COLUMN IF NOT EXISTS type TEXT;")
        cursor.execute("ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_designation_check;")
        cursor.execute("ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_type_check;")
        cursor.execute(
            """
            ALTER TABLE employees
            ADD CONSTRAINT employees_designation_check
            CHECK (designation IN ('T0', 'T1', 'T2', 'T3', 'T4'));
            """
        )
        cursor.execute(
            """
            ALTER TABLE employees
            ADD CONSTRAINT employees_type_check
            CHECK (type IN ('Full Time', 'Intern'));
            """
        )
    conn.commit()


def generate_employee(index, duplicate_guard):
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    department = random.choices(DEPARTMENTS, weights=DEPARTMENT_WEIGHTS, k=1)[0]
    designation = random.choices(DESIGNATIONS, weights=DESIGNATION_WEIGHTS, k=1)[0]
    location = random.choices(LOCATIONS, weights=LOCATION_WEIGHTS, k=1)[0]
    employee_type = random.choices(EMPLOYMENT_TYPES, weights=TYPE_WEIGHTS, k=1)[0]

    if employee_type == "Intern":
        designation = "T0"

    if department in {"Python Full Stack", "Data Scientist"}:
        client = random.choices(["Pepsi", "Google", "Visa", "Apple"], weights=[35, 30, 20, 15], k=1)[0]
    elif department == "Java Backend":
        client = random.choices(["Visa", "Ford", "Nike", "Google"], weights=[40, 25, 20, 15], k=1)[0]
    elif department == "DevOps":
        client = random.choices(["Google", "Apple", "Pepsi", "Ford"], weights=[35, 30, 20, 15], k=1)[0]
    elif department in {"Operations", "Finance"}:
        client = random.choices(["Visa", "Ford", "Nike", "Pepsi"], weights=[30, 30, 20, 20], k=1)[0]
    elif department in {"HR", "TA"}:
        client = random.choices(["Google", "Apple", "Visa", "Pepsi"], weights=[30, 30, 20, 20], k=1)[0]
    else:
        client = random.choice(CLIENTS)

    employee_id = f"E{index:04d}"
    slug_base = f"{first.lower()}.{last.lower()}"
    duplicate_guard[slug_base] += 1
    email = f"{slug_base}.{employee_id.lower()}@griddynamics.com"

    return (
        employee_id,
        f"{first} {last}",
        email,
        department,
        designation,
        location,
        employee_type,
        client,
    )


def insert_bulk(conn, count=250):
    duplicate_guard = defaultdict(int)
    employees = [generate_employee(index, duplicate_guard) for index in range(1, count + 1)]

    with conn.cursor() as cursor:
        cursor.executemany(
            """
            INSERT INTO employees (
                employee_id, name, email, department, designation, location, type, client
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (employee_id) DO UPDATE
            SET
                name = EXCLUDED.name,
                email = EXCLUDED.email,
                department = EXCLUDED.department,
                designation = EXCLUDED.designation,
                location = EXCLUDED.location,
                type = EXCLUDED.type,
                client = EXCLUDED.client;
            """,
            employees,
        )
    conn.commit()
    return len(employees)


def main():
    ensure_database_exists()
    with closing(connect_db()) as conn:
        create_table(conn)
        inserted = insert_bulk(conn)
    print(f"PostgreSQL ingestion complete. Upserted {inserted} employees.")


if __name__ == "__main__":
    main()
