import os
from typing import Any

import psycopg2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.api_core.exceptions import PermissionDenied, ResourceExhausted
from langchain_core.messages import HumanMessage
from orchestrator.agent import agent_executor, llm as shared_llm
from orchestrator.utils.db import run_query
from orchestrator.utils.employee_search_llm import plan_employee_search
from orchestrator.utils.postgres_queries import (
    build_employee_query,
    build_employee_query_from_filters,
)

app = FastAPI(title="Meeting Intelligence API")

# Allow all origins for the Chrome Extension UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    response: str

class EmployeeSearchRequest(BaseModel):
    query: str

class EmployeeSearchResponse(BaseModel):
    rows: list[dict[str, Any]]

@app.get("/api/health")
async def healthcheck():
    try:
        rows = run_query("SELECT 1 AS ok;")
        return {"ok": True, "db": rows[0]["ok"] if rows else None}
    except psycopg2.OperationalError:
        raise HTTPException(status_code=503, detail="PostgreSQL unavailable.")
    except psycopg2.Error:
        raise HTTPException(status_code=500, detail="PostgreSQL query failed.")

@app.post("/api/employees/search", response_model=EmployeeSearchResponse)
async def employee_search_endpoint(request: EmployeeSearchRequest):
    # Employee search should stay responsive even if Gemini credentials are missing/misconfigured.
    enable_llm = str(os.getenv("EMPLOYEE_SEARCH_USE_LLM", "0")).lower() in {"1", "true", "yes", "y"}
    has_api_key = bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"))
    plan = None

    if enable_llm and has_api_key:
        try:
            plan = plan_employee_search(request.query, shared_llm)
        except (ResourceExhausted, PermissionDenied):
            plan = None
        except Exception:
            plan = None

    if plan:
        sql, params = build_employee_query_from_filters(
            count=plan.count,
            department=plan.department,
            designation=plan.designation,
            location=plan.location,
            employee_type=plan.employee_type,
            client=plan.client,
            name=plan.name,
        )
    else:
        sql, params = build_employee_query(request.query)

    try:
        rows = run_query(sql, params)
    except psycopg2.OperationalError as exc:
        summary = (str(exc).splitlines() or ["PostgreSQL unavailable."])[0].strip()
        raise HTTPException(
            status_code=503,
            detail=f"{summary} (Check `DATABASE_URL` / `DB_*` env vars and that Postgres is running.)",
        ) from exc
    except psycopg2.Error as exc:
        raise HTTPException(status_code=500, detail="PostgreSQL query failed.") from exc

    return EmployeeSearchResponse(rows=rows)

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        result = agent_executor.invoke({"messages": [HumanMessage(content=request.query)]})
        final_message = result["messages"][-1].content
        return ChatResponse(response=final_message)
    except psycopg2.OperationalError:
        return ChatResponse(
            response=(
                "PostgreSQL is not reachable. Start the DB and set `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` "
                "in `.env`, then retry."
            )
        )
    except psycopg2.Error:
        return ChatResponse(response="PostgreSQL query failed. Check the backend logs and DB schema.")
    except ResourceExhausted:
        return ChatResponse(
            response=(
                "Gemini API quota/rate limit hit (HTTP 429). Wait a bit and try again, "
                "or increase quota/enable billing for your Google project."
            )
        )
    except PermissionDenied:
        return ChatResponse(
            response=(
                "Gemini API authentication failed (HTTP 403). Check that your `.env` has a valid "
                "`GOOGLE_API_KEY` (or `GEMINI_API_KEY`) and restart the backend."
            )
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
