from __future__ import annotations

import time
from typing import Protocol

from notification_service.ui_leave.models import UiLeaveNotificationRequest, UiLeaveNotificationResponse


def _truncate(message: str, max_len: int = 120) -> str:
    if len(message) <= max_len:
        return message
    return f"{message[: max(0, max_len - 1)]}…"


class UiLeaveModeDecider(Protocol):
    def __call__(self, request: UiLeaveNotificationRequest, now: int) -> UiLeaveNotificationResponse: ...


def should_notify_base(request: UiLeaveNotificationRequest, now: int) -> UiLeaveNotificationResponse | None:
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

    return None


def decide_ui_leave_notification(request: UiLeaveNotificationRequest, mode_decider: UiLeaveModeDecider) -> UiLeaveNotificationResponse:
    now = request.now if isinstance(request.now, int) else int(time.time() * 1000)

    base = should_notify_base(request, now)
    if base is not None:
        return base

    return mode_decider(request, now)


def build_default_message(query: str) -> tuple[str, str]:
    query = _truncate(query.strip() or "your search", 120)
    title = "Search in progress"
    message = f'You searched “{query}” but left Team Assistant. Reopen it to continue.'
    return title, message

