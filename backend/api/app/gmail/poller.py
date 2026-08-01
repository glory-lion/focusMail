import json

from schema import StyleProfile
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

    new_emails = [
        normalized
        for normalized in fetched
        if not session.exec(
            select(EmailMessage).where(
                EmailMessage.user_id == user.id,
                EmailMessage.gmail_id == normalized.gmail_id,
            )
        ).first()
    ]
    if not new_emails:
        return

    style_profile = StyleProfile(**user.style_profile) if user.style_profile else None

    # One call for every new email this poll found — whether that's 1 or
    # 20, the ai-service runs them concurrently rather than us looping
    # one HTTP round-trip per email.
    classifications = ai_client.classify_and_summarize_batch(new_emails, style_profile)

    for normalized, classification in zip(new_emails, classifications):
        email = EmailMessage(
            user_id=user.id,
            gmail_id=normalized.gmail_id,
            thread_id=normalized.thread_id,
            sender=normalized.sender,
            subject=normalized.subject,
            snippet=normalized.snippet,
            received_at=normalized.received_at,
            gmail_link=normalized.gmail_link,
            is_important=classification.is_important,
            urgency_score=classification.urgency_score,
            summary_short=classification.summary_short,
            summary_detailed=classification.summary_detailed,
            deadline=classification.deadline,
            action_items=[item.model_dump(mode="json") for item in classification.action_items],
            suggested_reply=classification.suggested_reply,
            reply_contains_commitment=classification.reply_contains_commitment,
            attachments_json=json.dumps(
                [attachment.model_dump() for attachment in normalized.attachments]
            ),
        )
        session.add(email)
        session.commit()

        if classification.is_important and user.notification_preference == "immediate":
            sender.send_immediate_notification(user, email)
