import secrets
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    refresh_token: str
    session_token: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32), index=True
    )
    notification_preference: str = Field(default="daily")  # "immediate" | "daily"
    digest_hour: int = Field(default=8)
    digest_minute: int = Field(default=0)
    push_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # StyleProfile dict (see shared/schema.py), extracted once at connect
    # time from the user's sent mail and cached here — never re-derived per
    # classify-batch call. None until that one-time extraction has run.
    style_profile: Optional[dict] = Field(default=None, sa_column=Column(JSON))


class EmailMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    gmail_id: str = Field(index=True)
    thread_id: str
    sender: str
    subject: str
    snippet: str
    received_at: datetime
    gmail_link: str
    is_important: Optional[bool] = None
    urgency_score: Optional[int] = None
    summary_short: Optional[str] = None
    summary_detailed: Optional[str] = None
    deadline: Optional[datetime] = None
    # List of {"id": str, "text": str, "due_date": str | None} — see ActionItem in shared/schema.py.
    # needs_action is derivable as bool(action_items), no separate column needed.
    action_items: Optional[list[dict]] = Field(default=None, sa_column=Column(JSON))
    suggested_reply: Optional[str] = None
    reply_contains_commitment: Optional[bool] = None
    attachments_json: str = Field(default="[]")
    is_read: bool = Field(default=False)
    is_archived: bool = Field(default=False)
    is_deleted: bool = Field(default=False)
    is_replied: bool = Field(default=False)
