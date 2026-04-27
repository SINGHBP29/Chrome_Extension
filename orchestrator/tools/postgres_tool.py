import json
from langchain_core.tools import tool
from orchestrator.utils.db import run_query
from orchestrator.utils.postgres_queries import build_employee_query

@tool
def postgres_tool(query: str) -> str:
    """
    Search for employee information in the PostgreSQL database based on natural language queries.
    Use this tool to find employees by name, department, location, client, designation, or employment type.
    """
    sql, params = build_employee_query(query)
    rows = run_query(sql, params)

    print(f"\n[Postgres Tool] Query run: '{query}'")
    if not rows:
        print("[Postgres Tool] Result: No employees found matching the criteria.")
        return "No employees found matching the criteria."

    result_json = json.dumps(rows, indent=2)
    print(f"[Postgres Tool] Result:\n{result_json}")
    return result_json
