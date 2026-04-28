from __future__ import annotations

import sqlite3
import time
import uuid
import os
from pathlib import Path
from typing import Any

DB_PATH = Path(
    os.getenv("NOTIFICATION_DB_PATH")
    or (Path(__file__).resolve().parent / "notifications.sqlite3")
)


def _now_ms() -> int:
    return int(time.time() * 1000)


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS notifications (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              message TEXT NOT NULL,
              created_at INTEGER NOT NULL,
              schedule_at INTEGER,
              sender TEXT,
              require_response INTEGER NOT NULL DEFAULT 0
            );
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS notification_recipients (
              notification_id TEXT NOT NULL,
              recipient TEXT NOT NULL,
              read_at INTEGER,
              responded_value TEXT,
              responded_at INTEGER,
              snoozed_until INTEGER,
              PRIMARY KEY (notification_id, recipient),
              FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
            );
            """
        )

        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_notification_recipients_recipient
            ON notification_recipients(recipient);
            """
        )


def create_notification(
    *,
    title: str,
    message: str,
    recipients: list[str],
    sender: str | None = None,
    require_response: bool = False,
    schedule_at: int | None = None,
    now: int | None = None,
) -> str:
    notification_id = str(uuid.uuid4())
    created_at = now if isinstance(now, int) else _now_ms()

    normalized_recipients = []
    for r in recipients:
        r = (r or "").strip().lower()
        if not r:
            continue
        if r not in normalized_recipients:
            normalized_recipients.append(r)

    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO notifications (id, title, message, created_at, schedule_at, sender, require_response)
            VALUES (?, ?, ?, ?, ?, ?, ?);
            """,
            (
                notification_id,
                title,
                message,
                created_at,
                schedule_at,
                sender,
                1 if require_response else 0,
            ),
        )

        conn.executemany(
            """
            INSERT INTO notification_recipients (notification_id, recipient, read_at, responded_value, responded_at, snoozed_until)
            VALUES (?, ?, NULL, NULL, NULL, NULL);
            """,
            [(notification_id, recipient) for recipient in normalized_recipients],
        )

    return notification_id


def list_notifications_for_recipient(
    *,
    recipient: str,
    now: int | None = None,
    include_scheduled: bool = False,
    limit: int = 20,
) -> list[dict[str, Any]]:
    recipient = (recipient or "").strip().lower()
    now_ms = now if isinstance(now, int) else _now_ms()
    safe_limit = min(max(int(limit), 1), 100)

    where_due = ""
    params: list[Any] = [recipient]

    if not include_scheduled:
        where_due = "AND COALESCE(r.snoozed_until, n.schedule_at, 0) <= ?"
        params.append(now_ms)

    params.append(safe_limit)

    query = f"""
        SELECT
          n.id AS id,
          n.title AS title,
          n.message AS message,
          n.created_at AS createdAt,
          n.schedule_at AS scheduleAt,
          n.sender AS sender,
          n.require_response AS requireResponse,
          r.recipient AS recipient,
          r.read_at AS readAt,
          r.responded_value AS responded,
          r.responded_at AS respondedAt,
          r.snoozed_until AS snoozedUntil
        FROM notifications n
        JOIN notification_recipients r ON r.notification_id = n.id
        WHERE r.recipient = ?
        {where_due}
        ORDER BY COALESCE(r.read_at, 0) ASC, n.created_at DESC
        LIMIT ?;
    """

    with _connect() as conn:
        rows = conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]


def respond_to_notification(
    *,
    notification_id: str,
    recipient: str,
    response: str,
    now: int | None = None,
) -> bool:
    recipient = (recipient or "").strip().lower()
    now_ms = now if isinstance(now, int) else _now_ms()

    with _connect() as conn:
        cur = conn.execute(
            """
            UPDATE notification_recipients
            SET responded_value = ?, responded_at = ?, read_at = ?
            WHERE notification_id = ? AND recipient = ?;
            """,
            (response, now_ms, now_ms, notification_id, recipient),
        )
        return cur.rowcount > 0


def mark_notification_read(
    *,
    notification_id: str,
    recipient: str,
    now: int | None = None,
) -> bool:
    recipient = (recipient or "").strip().lower()
    now_ms = now if isinstance(now, int) else _now_ms()

    with _connect() as conn:
        cur = conn.execute(
            """
            UPDATE notification_recipients
            SET read_at = COALESCE(read_at, ?)
            WHERE notification_id = ? AND recipient = ?;
            """,
            (now_ms, notification_id, recipient),
        )
        return cur.rowcount > 0


def snooze_notification(
    *,
    notification_id: str,
    recipient: str,
    minutes: int = 60,
    now: int | None = None,
) -> bool:
    recipient = (recipient or "").strip().lower()
    now_ms = now if isinstance(now, int) else _now_ms()
    minutes = max(1, min(int(minutes), 7 * 24 * 60))
    snoozed_until = now_ms + minutes * 60 * 1000

    with _connect() as conn:
        cur = conn.execute(
            """
            UPDATE notification_recipients
            SET snoozed_until = ?
            WHERE notification_id = ? AND recipient = ?;
            """,
            (snoozed_until, notification_id, recipient),
        )
        return cur.rowcount > 0


def list_notification_responses(
    *,
    notification_id: str,
) -> list[dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT recipient, responded_value AS responded, responded_at AS respondedAt, read_at AS readAt, snoozed_until AS snoozedUntil
            FROM notification_recipients
            WHERE notification_id = ?
            ORDER BY recipient ASC;
            """,
            (notification_id,),
        ).fetchall()
        return [dict(row) for row in rows]
