from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlmodel import Session, select

from ..db import engine
from ..gmail.poller import poll_all_users
from ..models import EmailMessage, User
from . import sender

RETENTION_DAYS = 7
POLL_INTERVAL_SECONDS = 75

scheduler = BackgroundScheduler()


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def discard_old_emails() -> None:
    cutoff = _utc_now() - timedelta(days=RETENTION_DAYS)
    with Session(engine) as session:
        old_emails = session.exec(
            select(EmailMessage).where(EmailMessage.received_at < cutoff)
        ).all()
        for email in old_emails:
            session.delete(email)
        session.commit()


def send_daily_digest(user_id: int) -> None:
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user or not user.push_token:
            return
        cutoff = _utc_now() - timedelta(days=1)
        recent = session.exec(
            select(EmailMessage).where(
                EmailMessage.user_id == user.id,
                EmailMessage.received_at >= cutoff,
            )
        ).all()
        important_count = sum(1 for e in recent if e.is_important)
        sender.send_push(
            user.push_token,
            title="Your daily email summary",
            body=f"{len(recent)} emails, {important_count} important",
        )


def schedule_user_digest(user: User) -> None:
    """(Re)schedules a user's daily digest for their chosen time.

    Called at startup for every user, and again from the settings endpoint
    whenever they change their notification time/preference.
    """
    scheduler.add_job(
        send_daily_digest,
        trigger=CronTrigger(hour=user.digest_hour, minute=user.digest_minute),
        args=[user.id],
        id=f"digest-{user.id}",
        replace_existing=True,
    )


def start() -> None:
    scheduler.add_job(
        poll_all_users,
        "interval",
        seconds=POLL_INTERVAL_SECONDS,
        id="poll",
        replace_existing=True,
    )
    scheduler.add_job(
        discard_old_emails, "cron", hour=3, id="discard", replace_existing=True
    )

    with Session(engine) as session:
        users = session.exec(select(User)).all()
        for user in users:
            schedule_user_digest(user)

    scheduler.start()
