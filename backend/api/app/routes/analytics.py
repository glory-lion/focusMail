from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..auth.dependencies import get_current_user
from ..db import get_session
from ..models import EmailMessage, User

router = APIRouter()


@router.get("/analytics")
def get_analytics(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=7)
    emails = session.exec(
        select(EmailMessage).where(
            EmailMessage.user_id == user.id,
            EmailMessage.received_at >= cutoff,
        )
    ).all()

    total = len(emails)
    important = sum(1 for e in emails if e.is_important)
    needs_action = sum(1 for e in emails if e.needs_action)

    return {
        "total_last_7_days": total,
        "important_count": important,
        "important_percent": round(important / total * 100, 1) if total else 0,
        "needs_action_count": needs_action,
    }
