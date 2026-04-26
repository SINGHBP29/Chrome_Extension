import re


DEPARTMENTS = {
    "java backend": "Java Backend",
    "python full stack": "Python Full Stack",
    "data scientist": "Data Scientist",
    "ui/ux": "UI/UX",
    "devops": "DevOps",
    "qa automation": "QA Automation",
    "operations": "Operations",
    "hr": "HR",
    "ta": "TA",
    "finance": "Finance",
}

LOCATIONS = {
    "bangalore": "Bangalore",
    "hyderabad": "Hyderabad",
    "chennai": "Chennai",
}

CLIENTS = {
    "pepsi": "Pepsi",
    "visa": "Visa",
    "google": "Google",
    "nike": "Nike",
    "ford": "Ford",
    "apple": "Apple",
}

EMPLOYMENT_TYPES = {
    "intern": "Intern",
    "interns": "Intern",
    "full time": "Full Time",
}

DESIGNATIONS = {"t0": "T0", "t1": "T1", "t2": "T2", "t3": "T3", "t4": "T4"}


def build_employee_query(query):
    query_lower = query.lower()
    where_clauses = []
    params = []

    employee_type = _extract_match(query_lower, EMPLOYMENT_TYPES)
    if employee_type:
        where_clauses.append("type = %s")
        params.append(employee_type)

    designation = _extract_match(query_lower, DESIGNATIONS)
    if designation:
        where_clauses.append("designation = %s")
        params.append(designation)

    department = _extract_match(query_lower, DEPARTMENTS)
    if department:
        where_clauses.append("department = %s")
        params.append(department)

    location = _extract_match(query_lower, LOCATIONS)
    if location:
        where_clauses.append("location = %s")
        params.append(location)

    client = _extract_match(query_lower, CLIENTS)
    if client:
        where_clauses.append("client = %s")
        params.append(client)

    person_name = _extract_person_name(query)
    if person_name:
        where_clauses.append("LOWER(name) = LOWER(%s)")
        params.append(person_name)

    if _is_count_query(query_lower):
        select_clause = "SELECT COUNT(*) AS total_employees FROM employees"
        suffix = ""
    else:
        select_clause = (
            "SELECT employee_id, name, email, department, designation, "
            "location, type, client FROM employees"
        )
        suffix = " ORDER BY name ASC LIMIT 10"

    where_sql = ""
    if where_clauses:
        where_sql = " WHERE " + " AND ".join(where_clauses)

    return select_clause + where_sql + suffix + ";", tuple(params)


def _extract_match(query_lower, mapping):
    for token, value in mapping.items():
        if token in query_lower:
            return value
    return None


def _is_count_query(query_lower):
    count_markers = ("how many", "count", "total number", "number of")
    return any(marker in query_lower for marker in count_markers)


def _extract_person_name(query):
    patterns = [
        r"(?:email|designation|client|location|department)\s+(?:of|for)\s+([A-Za-z]+(?:\s+[A-Za-z]+)+)",
        r"employee\s+([A-Za-z]+(?:\s+[A-Za-z]+)+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, query, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip(" ?.")

    return None
