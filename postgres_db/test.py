import psycopg2
from contextlib import closing
import os
import argparse
import re

DEFAULT_DB_USER = os.getenv("PGUSER") or os.getenv("USER") or "postgres"
DB_CONFIG = {
    "dbname": os.getenv("PGDATABASE", "hr_db"),
    "user": DEFAULT_DB_USER,
    "password": os.getenv("PGPASSWORD", ""),
    "host": os.getenv("PGHOST", "localhost"),
    "port": os.getenv("PGPORT", "5432"),
}

def connect_db():
    return psycopg2.connect(**DB_CONFIG)

def print_heading(title):
    print("\n" + "=" * 88)
    print(title)
    print("=" * 88)


def print_table(headers, rows):
    if not rows:
        print("No rows found.")
        return

    widths = [len(h) for h in headers]
    for row in rows:
        for i, value in enumerate(row):
            widths[i] = max(widths[i], len(str(value)))

    header_line = " | ".join(str(headers[i]).ljust(widths[i]) for i in range(len(headers)))
    divider = "-+-".join("-" * widths[i] for i in range(len(headers)))
    print(header_line)
    print(divider)
    for row in rows:
        print(" | ".join(str(row[i]).ljust(widths[i]) for i in range(len(headers))))


def run_query(conn, query, params=None, title="", headers=None, limit=10):
    sql_preview = " ".join(line.strip() for line in query.strip().splitlines())
    print(f"\n[SQL] {sql_preview}")
    print(f"[PARAMS] {params if params else 'None'}")

    with conn.cursor() as cursor:
        cursor.execute(query, params)
        rows = cursor.fetchall()

    print_heading(title)
    rows_to_show = rows[:limit]
    if headers:
        print_table(headers, rows_to_show)
    else:
        for row in rows_to_show:
            print(row)
    print(f"\nRows shown: {len(rows_to_show)} / Total matches: {len(rows)}")


def run_count_query(conn, query, params=None, title=""):
    sql_preview = " ".join(line.strip() for line in query.strip().splitlines())
    print(f"\n[SQL] {sql_preview}")
    print(f"[PARAMS] {params if params else 'None'}")
    with conn.cursor() as cursor:
        cursor.execute(query, params)
        count_value = cursor.fetchone()[0]
    print_heading(title)
    print(f"Total count: {count_value}")


def run_sql_query(conn, sql_query):
    cleaned = sql_query.strip().rstrip(";")
    if not cleaned:
        print("Empty SQL query.")
        return

    # Keep this mode read-only and predictable.
    if not cleaned.lower().startswith("select"):
        print("Only SELECT queries are allowed in SQL mode.")
        return

    print(f"\n[SQL] {cleaned};")
    with conn.cursor() as cursor:
        cursor.execute(cleaned + ";")
        rows = cursor.fetchall()
        headers = [desc[0] for desc in cursor.description] if cursor.description else []

    print_heading("SQL Query Result")
    if headers:
        print_table(headers, rows[:10])
    else:
        print("Query executed successfully.")
    print(f"\nRows shown: {min(len(rows), 10)} / Total matches: {len(rows)}")


DEPARTMENT_ALIASES = {
    "java backend": "Java Backend",
    "python": "Python Full Stack",
    "python full stack": "Python Full Stack",
    "data scientist": "Data Scientist",
    "ui/ux": "UI/UX",
    "ui ux": "UI/UX",
    "devops": "DevOps",
    "qa": "QA Automation",
    "qa automation": "QA Automation",
    "operations": "Operations",
    "hr": "HR",
    "ta": "TA",
    "finance": "Finance",
}
KNOWN_LOCATIONS = ["Bangalore", "Hyderabad", "Chennai"]
KNOWN_CLIENTS = ["Pepsi", "Visa", "Google", "Nike", "Ford", "Apple"]
KNOWN_DESIGNATIONS = ["T0", "T1", "T2", "T3", "T4"]


def has_phrase(text, phrase):
    pattern = r"\b" + r"\s+".join(re.escape(part) for part in phrase.lower().split()) + r"\b"
    return re.search(pattern, text.lower()) is not None


def extract_name_candidate(question):
    q_lower = question.lower()
    if any(token in q_lower for token in ["how many", "count", "total count", "number of"]):
        return None

    patterns = [
        r"\b(?:of|for)\s+([A-Za-z]+(?:\s+[A-Za-z]+){1,2})\b",
        r"\b(?:is|about)\s+([A-Za-z]+(?:\s+[A-Za-z]+){1,2})\b",
    ]
    stopwords = {"in", "at", "from", "for", "of", "on", "with", "there", "total"}
    for pattern in patterns:
        match = re.search(pattern, question, flags=re.IGNORECASE)
        if match:
            words = match.group(1).split()
            while words and words[-1].lower() in stopwords:
                words.pop()
            if len(words) >= 2:
                return " ".join(word.capitalize() for word in words)
    return None


def detect_requested_field(normalized_question):
    field_phrases = [
        ("designation", "designation"),
        ("department", "department"),
        ("client", "client"),
        ("location", "location"),
        ("email", "email"),
        ("type", "type"),
    ]
    for phrase, field in field_phrases:
        if has_phrase(normalized_question, phrase):
            return field
    return None


def build_dynamic_query(question):
    normalized = question.lower()
    conditions = []
    params = []

    # Department detection
    for key, department in DEPARTMENT_ALIASES.items():
        if has_phrase(normalized, key):
            conditions.append("department = %s")
            params.append(department)
            break

    # Location detection
    for location in KNOWN_LOCATIONS:
        if has_phrase(normalized, location):
            conditions.append("location = %s")
            params.append(location)
            break

    # Client detection
    for client in KNOWN_CLIENTS:
        if has_phrase(normalized, client):
            conditions.append("client = %s")
            params.append(client)
            break

    # Designation detection
    for designation in KNOWN_DESIGNATIONS:
        if has_phrase(normalized, designation):
            conditions.append("designation = %s")
            params.append(designation)
            break

    # Type detection
    if has_phrase(normalized, "intern") or has_phrase(normalized, "interns"):
        conditions.append("type = %s")
        params.append("Intern")
    elif has_phrase(normalized, "full time"):
        conditions.append("type = %s")
        params.append("Full Time")

    # Name detection for person-specific questions.
    person_name = extract_name_candidate(question)
    if person_name:
        conditions.append("name ILIKE %s")
        params.append(person_name)

    wants_count = (
        has_phrase(normalized, "how many")
        or has_phrase(normalized, "count")
        or has_phrase(normalized, "total")
        or has_phrase(normalized, "number of")
    )

    requested_field = detect_requested_field(normalized)

    return {
        "conditions": conditions,
        "params": params,
        "wants_count": wants_count,
        "requested_field": requested_field,
        "person_name": person_name,
    }


def run_interactive_questions(conn):
    print("\nInteractive HR question mode.")
    print("Ask questions like: interns in bangalore, python team at pepsi, t1 in hyderabad")
    print("Type 'quit' or 'exit' to stop.")

    while True:
        question = input("\nquestion> ").strip()
        if not question:
            print("Please enter a question.")
            continue
        if question.lower() in {"quit", "exit"}:
            print("Exiting interactive mode.")
            break

        parsed = build_dynamic_query(question)
        conditions = parsed["conditions"]
        params = parsed["params"]
        wants_count = parsed["wants_count"]
        requested_field = parsed["requested_field"]

        if not conditions and not wants_count and not requested_field:
            print("Could not map this question. Try: name, department, location, client, designation, type, count.")
            continue

        if wants_count:
            count_query = "SELECT COUNT(*) FROM employees"
            if conditions:
                count_query += " WHERE " + " AND ".join(conditions)
            count_query += ";"
            run_count_query(
                conn,
                count_query,
                tuple(params) if params else None,
                title=f"Question Result: {question}",
            )
            continue

        selected_columns = "employee_id, name, department, designation, location, type, client"
        headers = ["employee_id", "name", "department", "designation", "location", "type", "client"]

        # For person + field questions, return a focused answer.
        if requested_field and parsed["person_name"]:
            selected_columns = f"employee_id, name, {requested_field}"
            headers = ["employee_id", "name", requested_field]
        elif requested_field and not parsed["person_name"]:
            selected_columns = f"employee_id, name, {requested_field}"
            headers = ["employee_id", "name", requested_field]

        base_query = f"""
            SELECT {selected_columns}
            FROM employees
        """
        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)
        base_query += " ORDER BY employee_id;"

        run_query(
            conn,
            base_query,
            tuple(params) if params else None,
            title=f"Question Result: {question}",
            headers=headers,
        )


def run_interactive_sql(conn):
    print("\nInteractive SQL mode enabled (read-only).")
    print("Enter SQL SELECT queries directly.")
    print("Example: SELECT name, designation FROM employees WHERE client = 'Pepsi';")
    print("Type 'quit' or 'exit' to stop.")

    while True:
        sql_input = input("\nsql> ").strip()
        if not sql_input:
            print("Please enter a SQL query.")
            continue
        if sql_input.lower() in {"quit", "exit"}:
            print("Exiting SQL mode.")
            break
        run_sql_query(conn, sql_input)

def run_default_queries(conn):
    run_query(
        conn,
        """
        SELECT employee_id, name, department, designation
        FROM employees
        WHERE department = %s
        ORDER BY employee_id;
        """,
        ("Python Full Stack",),
        "Employees by Department: Python Full Stack",
        headers=["employee_id", "name", "department", "designation"],
    )

    run_query(
        conn,
        """
        SELECT employee_id, name, location, department
        FROM employees
        WHERE location = %s
        ORDER BY employee_id;
        """,
        ("Bangalore",),
        "Employees by Location: Bangalore",
        headers=["employee_id", "name", "location", "department"],
    )

    run_query(
        conn,
        """
        SELECT employee_id, name, client, department
        FROM employees
        WHERE client = %s
        ORDER BY employee_id;
        """,
        ("Pepsi",),
        "Employees by Client: Pepsi",
        headers=["employee_id", "name", "client", "department"],
    )

    run_query(
        conn,
        """
        SELECT employee_id, name, type, designation
        FROM employees
        WHERE type = 'Intern'
        ORDER BY employee_id;
        """,
        title="Interns List",
        headers=["employee_id", "name", "type", "designation"],
    )

    run_query(
        conn,
        """
        SELECT employee_id, name, designation, department
        FROM employees
        WHERE designation = 'T1'
        ORDER BY employee_id;
        """,
        title="Junior Employees (T1)",
        headers=["employee_id", "name", "designation", "department"],
    )

    run_query(
        conn,
        """
        SELECT employee_id, name, department, location, client
        FROM employees
        WHERE department = 'Python Full Stack'
          AND location = 'Bangalore'
          AND client = 'Pepsi'
        ORDER BY employee_id;
        """,
        title="Advanced Query: Python developers for Pepsi in Bangalore",
        headers=["employee_id", "name", "department", "location", "client"],
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run HR employee queries on PostgreSQL")
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Start interactive question mode",
    )
    parser.add_argument(
        "--sql",
        action="store_true",
        help="Start interactive SQL mode (SELECT only)",
    )
    args = parser.parse_args()

    try:
        with closing(connect_db()) as conn:
            print("[START] Running PostgreSQL HR query checks")
            print(
                f"[INFO] Using DB config: db={DB_CONFIG['dbname']} user={DB_CONFIG['user']} "
                f"host={DB_CONFIG['host']} port={DB_CONFIG['port']}"
            )
            if args.sql:
                run_interactive_sql(conn)
            elif args.interactive:
                run_interactive_questions(conn)
            else:
                run_default_queries(conn)

            print("\n[DONE] Query checks completed")
    except Exception as exc:
        print(f"[ERROR] Query checks failed: {exc}")
        print(
            "[HINT] Set PGUSER/PGPASSWORD/PGDATABASE env vars if your local "
            "Postgres user is not the default."
        )
        raise