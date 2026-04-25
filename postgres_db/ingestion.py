import random
import os
from collections import defaultdict
from contextlib import closing

import psycopg2
from psycopg2 import errorcodes
from psycopg2 import sql

# =========================
# DB CONFIG
# =========================
DEFAULT_DB_USER = os.getenv("PGUSER") or os.getenv("USER") or "postgres"

DB_CONFIG = {
    "dbname": os.getenv("PGDATABASE", "hr_db"),
    "user": DEFAULT_DB_USER,
    "password": os.getenv("PGPASSWORD", ""),
    "host": os.getenv("PGHOST", "localhost"),
    "port": os.getenv("PGPORT", "5432"),
}

# =========================
# SAMPLE DATA POOLS
# =========================
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
    "Java Backend",
    "Python Full Stack",
    "Data Scientist",
    "UI/UX",
    "DevOps",
    "QA Automation",
    "Operations",
    "HR",
    "TA",
    "Finance",
]

DESIGNATIONS = ["T0", "T1", "T2", "T3", "T4"]
LOCATIONS = ["Bangalore", "Hyderabad", "Chennai"]
EMPLOYMENT_TYPES = ["Full Time", "Intern"]
CLIENTS = ["Pepsi", "Visa", "Google", "Nike", "Ford", "Apple"]

DEPARTMENT_WEIGHTS = [18, 18, 12, 10, 12, 8, 8, 6, 4, 4]
LOCATION_WEIGHTS = [50, 30, 20]
DESIGNATION_WEIGHTS = [4, 34, 28, 22, 12]
TYPE_WEIGHTS = [82, 18]

# =========================
# CONNECT DB
# =========================
def connect_db():
    return psycopg2.connect(**DB_CONFIG)


def ensure_database_exists():
    try:
        with closing(connect_db()):
            return
    except psycopg2.OperationalError as exc:
        msg = str(exc).lower()
        missing_db = (
            getattr(exc, "pgcode", None) == errorcodes.INVALID_CATALOG_NAME
            or "does not exist" in msg
        )
        if not missing_db:
            raise

    admin_config = dict(DB_CONFIG)
    admin_config["dbname"] = os.getenv("PGMAINTENANCE_DB", "postgres")

    try:
        with closing(psycopg2.connect(**admin_config)) as admin_conn:
            admin_conn.autocommit = True
            with admin_conn.cursor() as cursor:
                cursor.execute(
                    sql.SQL("CREATE DATABASE {}").format(
                        sql.Identifier(DB_CONFIG["dbname"])
                    )
                )
            print(f"[STEP] Created database: {DB_CONFIG['dbname']}")
    except psycopg2.errors.DuplicateDatabase:
        print(f"[STEP] Database already exists: {DB_CONFIG['dbname']}")

# =========================
# CREATE TABLE
# =========================
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
        # Ensure required columns exist on older tables.
        cursor.execute("ALTER TABLE employees ADD COLUMN IF NOT EXISTS type TEXT;")
        # Re-apply constraints with explicit names so schema stays consistent.
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

# =========================
# GENERATE DATA
# =========================
def generate_employee(i, duplicate_guard):
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    department = random.choices(DEPARTMENTS, weights=DEPARTMENT_WEIGHTS, k=1)[0]
    designation = random.choices(DESIGNATIONS, weights=DESIGNATION_WEIGHTS, k=1)[0]
    location = random.choices(LOCATIONS, weights=LOCATION_WEIGHTS, k=1)[0]
    employee_type = random.choices(EMPLOYMENT_TYPES, weights=TYPE_WEIGHTS, k=1)[0]

    # Keep interns mostly junior in realistic proportions.
    if employee_type == "Intern":
        designation = "T0"

    # Align likely client-department staffing to make test queries meaningful.
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

    employee_id = f"E{i:04d}"
    name = f"{first} {last}"

    slug_base = f"{first.lower()}.{last.lower()}"
    duplicate_guard[slug_base] += 1
    # Keep email stable and unique across reruns by embedding employee_id.
    email = f"{slug_base}.{employee_id.lower()}@griddynamics.com"

    return (
        employee_id,
        name,
        email,
        department,
        designation,
        location,
        employee_type,
        client,
    )

# =========================
# INSERT DATA
# =========================
def insert_bulk(conn, n=250):
    duplicate_guard = defaultdict(int)
    employees = [generate_employee(i, duplicate_guard) for i in range(1, n + 1)]
    query = """
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
    """

    with conn.cursor() as cursor:
        cursor.executemany(query, employees)
        inserted_or_updated = cursor.rowcount
    conn.commit()

    print(f"[INFO] Generated employee rows: {n}")
    print(f"[INFO] Rows inserted/updated: {inserted_or_updated}")

# =========================
# MAIN
# =========================
if __name__ == "__main__":
    print("[START] PostgreSQL HR ingestion started")
    print(
        f"[INFO] Using DB config: db={DB_CONFIG['dbname']} user={DB_CONFIG['user']} "
        f"host={DB_CONFIG['host']} port={DB_CONFIG['port']}"
    )
    try:
        ensure_database_exists()
        with closing(connect_db()) as conn:
            print("[STEP] Connected to database")
            print("[STEP] Creating employees table if missing")
            create_table(conn)
            print("[STEP] Inserting/updating employee records")
            insert_bulk(conn, n=250)
            print("[DONE] Ingestion completed successfully")
    except Exception as exc:
        print(f"[ERROR] Ingestion failed: {exc}")
        print(
            "[HINT] Set PGUSER/PGPASSWORD/PGDATABASE env vars if your local "
            "Postgres user is not the default."
        )
        raise