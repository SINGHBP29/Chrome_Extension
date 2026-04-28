from __future__ import annotations

from notification_service.ui_leave.base import _truncate
from notification_service.ui_leave.models import UiLeaveNotificationRequest, UiLeaveNotificationResponse


def decide_meetings_ui_leave_notification(
    request: UiLeaveNotificationRequest,
    now: int,
) -> UiLeaveNotificationResponse:
    search_state = request.searchState
    query = (search_state.query if search_state else "") or ""

    query = _truncate(query.strip() or "your question", 120)
    title = "Meeting search in progress"
    message = f'You asked “{query}” but left Meeting Intelligence. Reopen it to see the answer.'

    return UiLeaveNotificationResponse(
        notify=True,
        title=title,
        message=message,
        clearSearchState=True,
        setLastNotifiedAt=now,
    )
