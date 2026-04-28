from __future__ import annotations

from notification_service.ui_leave.base import build_default_message
from notification_service.ui_leave.meetings import decide_meetings_ui_leave_notification
from notification_service.ui_leave.models import UiLeaveNotificationRequest, UiLeaveNotificationResponse


def decide_ui_leave_notification_by_mode(
    request: UiLeaveNotificationRequest,
    now: int,
) -> UiLeaveNotificationResponse:
    search_state = request.searchState
    mode = (search_state.mode if search_state else "") or ""
    mode = mode.strip().lower()

    if mode == "meetings":
        return decide_meetings_ui_leave_notification(request, now)

    query = (search_state.query if search_state else "") or ""
    title, message = build_default_message(query)
    return UiLeaveNotificationResponse(
        notify=True,
        title=title,
        message=message,
        clearSearchState=True,
        setLastNotifiedAt=now,
    )

