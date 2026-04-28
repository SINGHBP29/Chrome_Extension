import json
import re

from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage, SystemMessage

from orchestrator.utils.postgres_queries import CLIENTS, DEPARTMENTS, DESIGNATIONS, EMPLOYMENT_TYPES, LOCATIONS


class EmployeeQueryPlan(BaseModel):
    count: bool = False
    department: str | None = None
    designation: str | None = None
    location: str | None = None
    employee_type: str | None = Field(default=None, alias="type")
    client: str | None = None
    name: str | None = None


_VALID_DEPARTMENTS = set(DEPARTMENTS.values())
_VALID_DESIGNATIONS = set(DESIGNATIONS.values())
_VALID_LOCATIONS = set(LOCATIONS.values())
_VALID_TYPES = set(EMPLOYMENT_TYPES.values())
_VALID_CLIENTS = set(CLIENTS.values())


def _extract_json(text: str) -> dict | None:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None

    try:
        return json.loads(cleaned[start : end + 1])
    except json.JSONDecodeError:
        return None


def _sanitize_name(name: str | None) -> str | None:
    if not name:
        return None

    value = name.strip()
    if not value or len(value) > 80:
        return None

    # Keep it simple and safe: only typical name chars.
    if not re.fullmatch(r"[A-Za-z][A-Za-z .'-]*", value):
        return None

    return value


def plan_employee_search(query: str, llm) -> EmployeeQueryPlan | None:
    prompt = SystemMessage(
        content=(
            "Convert the user's employee search request into a JSON object for a Postgres query.\n"
            "Output ONLY valid JSON (no markdown/code fences).\n\n"
            "Schema:\n"
            '{\n'
            '  "count": boolean,\n'
            '  "department": string|null,\n'
            '  "designation": string|null,\n'
            '  "location": string|null,\n'
            '  "type": string|null,\n'
            '  "client": string|null,\n'
            '  "name": string|null\n'
            '}\n\n'
            "Rules:\n"
            "- Use these canonical values or null:\n"
            f"  department: {sorted(_VALID_DEPARTMENTS)}\n"
            f"  designation: {sorted(_VALID_DESIGNATIONS)}\n"
            f"  location: {sorted(_VALID_LOCATIONS)}\n"
            f"  type: {sorted(_VALID_TYPES)}\n"
            f"  client: {sorted(_VALID_CLIENTS)}\n"
            "- If the user asks for 'how many' / 'count', set count=true.\n"
            "- If the user asks for a specific person's info, set name to the full name.\n"
            "- If unsure, set that field to null.\n"
        )
    )

    result = llm.invoke([prompt, HumanMessage(content=query)])
    payload = _extract_json(getattr(result, "content", "") or "")
    if payload is None:
        return None

    plan = EmployeeQueryPlan.model_validate(payload)

    department = plan.department if plan.department in _VALID_DEPARTMENTS else None
    designation = plan.designation if plan.designation in _VALID_DESIGNATIONS else None
    location = plan.location if plan.location in _VALID_LOCATIONS else None
    employee_type = plan.employee_type if plan.employee_type in _VALID_TYPES else None
    client = plan.client if plan.client in _VALID_CLIENTS else None
    name = _sanitize_name(plan.name)

    return EmployeeQueryPlan(
        count=bool(plan.count),
        department=department,
        designation=designation,
        location=location,
        employee_type=employee_type,
        client=client,
        name=name,
    )

