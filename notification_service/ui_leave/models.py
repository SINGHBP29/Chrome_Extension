from __future__ import annotations

import time
from typing import Literal

from pydantic import BaseModel, Field


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


class MeetingUiLeaveNotificationResponse(UiLeaveNotificationResponse):
    mode: str = Field(default="meetings")
    generatedAt: int = Field(default_factory=lambda: int(time.time() * 1000))

