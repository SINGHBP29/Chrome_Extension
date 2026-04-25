# PostgreSQL HR Employee Module

This module stores and queries structured HR employee data for the Grid Dynamics backend.

It is part of the hybrid system:
- `chroma_db/` for unstructured meeting notes
- `postgres_db/` for structured employee records

## Files

- `ingestion.py`  
  Creates database/table (if needed) and ingests bulk employee data.
- `test.py`  
  Runs predefined HR queries and supports interactive query modes.

## Employee Schema

Table: `employees`

Columns:
- `employee_id` (primary key)
- `name`
- `email` (unique)
- `department`
- `designation`
- `location`
- `type` (`Intern` or `Full Time`)
- `client`

Constraints:
- `designation` must be one of: `T0`, `T1`, `T2`, `T3`, `T4`
- `type` must be one of: `Intern`, `Full Time`

## Ingestion Behavior (`ingestion.py`)

- Uses environment-based DB config:
  - `PGDATABASE` (default: `hr_db`)
  - `PGUSER` (default: OS user)
  - `PGPASSWORD`
  - `PGHOST` (default: `localhost`)
  - `PGPORT` (default: `5432`)
- Auto-creates database if missing.
- Auto-creates table if missing.
- Ensures required constraints are present.
- Generates realistic random employee data (default: 250 rows).
- Departments include:
  - Java Backend
  - Python Full Stack
  - Data Scientist
  - UI/UX
  - DevOps
  - QA Automation
  - Operations
  - HR
  - TA
  - Finance
- Interns are assigned designation `T0`.
- Uses `ON CONFLICT (employee_id) DO UPDATE` for idempotent reruns.
- Prints clear logs for each step.

## Query Modes (`test.py`)

### 1) Default mode (predefined HR checks)

```bash
python postgres_db/test.py
```

Runs:
- employees by department
- employees by location
- employees by client
- interns list
- junior employees (`T1`)
- advanced filter (Python Full Stack + Pepsi + Bangalore)

### 2) Interactive question mode (text-driven)

```bash
python postgres_db/test.py --interactive
```

You can ask questions like:
- `what is the designation of Yash Chopra?`
- `how many people are working with pepsi client?`
- `what is the total count of interns?`

### 3) Interactive SQL mode (SQL-only, read-only)

```bash
python postgres_db/test.py --sql
```

Important:
- Accepts only `SELECT` queries.
- Prints SQL and formatted output in terminal.

Example:

```sql
SELECT employee_id, name, designation FROM employees WHERE name = 'Yash Chopra';
SELECT COUNT(*) AS intern_count FROM employees WHERE type = 'Intern';
```

## Setup and Run

From project root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python postgres_db/ingestion.py
python postgres_db/test.py
```

## Notes

- If DB auth differs on your machine, set env vars before running:

```bash
export PGUSER=your_user
export PGPASSWORD=your_password
export PGDATABASE=hr_db
export PGHOST=localhost
export PGPORT=5432
```

- `test.py` shows top 10 rows by default with total match count.
