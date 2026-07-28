from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from schema import Classification, ClassifiedEmail
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
    """

    id: int


class DayGroup(BaseModel):
    date: str
    emails: list[EmailOut]


def _to_email_out(email: EmailMessage) -> EmailOut:
    classification = None
    if email.needs_action is not None:
        classification = Classification(
            needs_action=email.needs_action,
            has_deadline=email.has_deadline,
            is_important=email.is_important,
            summary=email.summary or "",
        )
    return EmailOut(
        id=email.id,
        gmail_id=email.gmail_id,
        thread_id=email.thread_id,
        sender=email.sender,
        subject=email.subject,
        snippet=email.snippet,
        received_at=email.received_at,
        gmail_link=email.gmail_link,
        classification=classification,
    )


@router.get("/emails", response_model=list[DayGroup])
def list_emails(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    emails = session.exec(
        select(EmailMessage)
        .where(EmailMessage.user_id == user.id)
        .order_by(EmailMessage.received_at.desc())
    ).all()

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
    return _to_email_out(email)


class SendReplyRequest(BaseModel):
    body: str


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

    gmail_client.send_reply(user, email, payload.body)
    return {"status": "sent"}
