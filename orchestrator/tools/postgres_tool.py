import json

from orchestrator.config import get_llm
from orchestrator.utils.db import run_query
from orchestrator.utils.postgres_queries import build_employee_query

def postgres_tool(state):
    query = state["query"]
    sql, params = build_employee_query(query)
    rows = run_query(sql, params)

    if not rows:
        return {"response": "I don't know."}

    llm = get_llm()
    prompt = f"""
    You answer employee-related questions using only the SQL result below.
    If the answer is not present in the SQL result, say "I don't know."

    User question:
    {query}

    SQL used:
    {sql}

    SQL result:
    {json.dumps(rows, indent=2)}
    """

    response = llm.invoke(prompt).content
    return {"response": response}
