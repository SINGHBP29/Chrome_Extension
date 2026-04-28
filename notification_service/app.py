from __future__ import annotations

import time
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from notification_service.storage import init_db

def _truncate(message: str, max_len: int = 120) -> str:
    if len(message) <= max_len:
        return message
    return f"{message[: max(0, max_len - 1)]}…"


class SearchState(BaseModel):
    query: str | None = None
    mode: str | None = None
    status: Literal["pending", "completed", "failed"] | str = "pending"
    startedAt: int | None = None
    finishedAt: int | None = None


class UiLeaveNotificationRequest(BaseModel):
    searchState: SearchState | None = None
    suppressUntil: int | None = None
    lastNotifiedAt: int | None = None
    now: int | None = None


class UiLeaveNotificationResponse(BaseModel):
    notify: bool = False
    title: str | None = None
    message: str | None = None
    clearSearchState: bool = False
    setLastNotifiedAt: int | None = None


def decide_ui_leave_notification(
    request: UiLeaveNotificationRequest,
) -> UiLeaveNotificationResponse:
    now = request.now if isinstance(request.now, int) else int(time.time() * 1000)

    if isinstance(request.suppressUntil, int) and now < request.suppressUntil:
        return UiLeaveNotificationResponse(notify=False)

    search_state = request.searchState
    if not search_state or search_state.status != "pending":
        return UiLeaveNotificationResponse(notify=False)

    started_at = search_state.startedAt if isinstance(search_state.startedAt, int) else 0
    if started_at and now - started_at > 2 * 60 * 1000:
        return UiLeaveNotificationResponse(notify=False, clearSearchState=True)

    if isinstance(request.lastNotifiedAt, int) and now - request.lastNotifiedAt < 15 * 1000:
        return UiLeaveNotificationResponse(notify=False)

    query = (search_state.query or "").strip() or "your search"
    query = _truncate(query, 120)

    title = "Search in progress"
    message = f'You searched “{query}” but left Team Assistant. Reopen it to continue.'

    return UiLeaveNotificationResponse(
        notify=True,
        title=title,
        message=message,
        clearSearchState=True,
        setLastNotifiedAt=now,
    )


app = FastAPI(title="Team Assistant Notification API")

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/notifications/ui-leave", response_model=UiLeaveNotificationResponse)
async def ui_leave_notification_endpoint(request: UiLeaveNotificationRequest):
    return decide_ui_leave_notification(request)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
