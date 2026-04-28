from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from notification_service.storage import init_db
from notification_service.ui_leave import UiLeaveNotificationRequest, UiLeaveNotificationResponse, decide_ui_leave_notification
from notification_service.ui_leave.router import decide_ui_leave_notification_by_mode


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
    return decide_ui_leave_notification(request, decide_ui_leave_notification_by_mode)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
