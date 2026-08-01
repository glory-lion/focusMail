import json

from sqlmodel import Session, select

from .. import ai_client
from ..db import engine
from ..models import EmailMessage, User
from ..notifications import sender
from . import client as gmail_client


def poll_all_users() -> None:
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        for user in users:
            _poll_user(session, user)


def _poll_user(session: Session, user: User) -> None:
    fetched = gmail_client.fetch_recent_emails(user)
    for normalized in fetched:
        already_stored = session.exec(
            select(EmailMessage).where(
                EmailMessage.user_id == user.id,
                EmailMessage.gmail_id == normalized.gmail_id,
            )
        ).first()
        if already_stored:
            continue

        classification = ai_client.classify_and_summarize(normalized)

        email = EmailMessage(
            user_id=user.id,
            gmail_id=normalized.gmail_id,
            thread_id=normalized.thread_id,
            sender=normalized.sender,
            subject=normalized.subject,
            snippet=normalized.snippet,
            received_at=normalized.received_at,
            gmail_link=normalized.gmail_link,
            needs_action=classification.needs_action,
            has_deadline=classification.has_deadline,
            is_important=classification.is_important,
            urgency_score=classification.urgency_score,
            summary=classification.summary,
            attachments_json=json.dumps(
                [attachment.model_dump() for attachment in normalized.attachments]
            ),
        )
        session.add(email)
        session.commit()

        if classification.is_important and user.notification_preference == "immediate":
            sender.send_immediate_notification(user, email)
