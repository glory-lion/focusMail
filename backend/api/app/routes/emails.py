from collections import defaultdict
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from schema import ActionItem, Attachment, Classification, ClassifiedEmail
from sqlmodel import Session, select

from ..auth.dependencies import get_current_user
from ..db import get_session
from ..gmail import client as gmail_client
from ..models import EmailMessage, User

router = APIRouter()


class EmailOut(ClassifiedEmail):
    """The shared ClassifiedEmail shape, plus our own id so the client can
    address this email in later requests (GET /emails/{id}, .../send).
    Deliberately does NOT include user_id or any other internal DB detail.

    `body` is only ever populated by GET /emails/{id} — fetched live from
    Gmail on open, never stored — so it's None everywhere else, including
    the /emails list.
    """

    id: int
    body: Optional[str] = None
    attachments: list[Attachment] = Field(default_factory=list)
    has_attachment: bool = False
    is_read: bool = False
    is_archived: bool = False
    is_deleted: bool = False
    is_replied: bool = False


class DayGroup(BaseModel):
    date: str
    emails: list[EmailOut]


def _to_email_out(email: EmailMessage) -> EmailOut:
    classification = None
    if email.is_important is not None:
        classification = Classification(
            is_important=email.is_important,
            urgency_score=email.urgency_score or 0,
            summary_short=email.summary_short or "",
            summary_detailed=email.summary_detailed or "",
            deadline=email.deadline,
            action_items=[ActionItem(**item) for item in (email.action_items or [])],
            suggested_reply=email.suggested_reply or "",
            reply_contains_commitment=email.reply_contains_commitment or False,
        )
    try:
        attachments = [Attachment(**item) for item in json.loads(email.attachments_json)]
    except (TypeError, ValueError):
        attachments = []
    return EmailOut(
        id=email.id,
        gmail_id=email.gmail_id,
        thread_id=email.thread_id,
        sender=email.sender,
        subject=email.subject,
        snippet=email.snippet,
        received_at=email.received_at,
        gmail_link=email.gmail_link,
        attachments=attachments,
        has_attachment=bool(attachments),
        is_read=email.is_read,
        is_archived=email.is_archived,
        is_deleted=email.is_deleted,
        is_replied=email.is_replied,
        classification=classification,
    )


@router.get("/emails", response_model=list[DayGroup])
def list_emails(
    include_archived: bool = False,
    include_deleted: bool = False,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    query = select(EmailMessage).where(EmailMessage.user_id == user.id)
    if not include_archived:
        query = query.where(EmailMessage.is_archived == False)  # noqa: E712
    if not include_deleted:
        query = query.where(EmailMessage.is_deleted == False)  # noqa: E712
    emails = session.exec(query.order_by(EmailMessage.received_at.desc())).all()

    grouped: dict[str, list[EmailOut]] = defaultdict(list)
    for email in emails:
        grouped[email.received_at.date().isoformat()].append(_to_email_out(email))

    return [
        DayGroup(date=day, emails=grouped[day]) for day in sorted(grouped, reverse=True)
    ]


@router.get("/emails/{email_id}", response_model=EmailOut)
def get_email(
    email_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    email = session.get(EmailMessage, email_id)
    if not email or email.user_id != user.id:
        raise HTTPException(status_code=404, detail="Email not found")

    out = _to_email_out(email)
    out.body = gmail_client.fetch_body(user, email.gmail_id)
    if not email.is_read:
        email.is_read = True
        session.add(email)
        session.commit()
        out.is_read = True
    return out


class EmailStateUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_archived: Optional[bool] = None
    is_deleted: Optional[bool] = None
    is_replied: Optional[bool] = None


@router.patch("/emails/{email_id}/state", response_model=EmailOut)
def update_email_state(
    email_id: int,
    payload: EmailStateUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    email = session.get(EmailMessage, email_id)
    if not email or email.user_id != user.id:
        raise HTTPException(status_code=404, detail="Email not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(email, field, value)
    session.add(email)
    session.commit()
    session.refresh(email)
    return _to_email_out(email)


class ReplyAttachment(BaseModel):
    filename: str
    mime_type: str
    content_base64: str


class SendReplyRequest(BaseModel):
    body: str
    attachments: list[ReplyAttachment] = []


@router.post("/emails/{email_id}/send")
def send_reply(
    email_id: int,
    payload: SendReplyRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    email = session.get(EmailMessage, email_id)
    if not email or email.user_id != user.id:
        raise HTTPException(status_code=404, detail="Email not found")

    gmail_client.send_reply(
        user, email, payload.body, [a.model_dump() for a in payload.attachments]
    )
    email.is_replied = True
    session.add(email)
    session.commit()
    return {"status": "sent"}
