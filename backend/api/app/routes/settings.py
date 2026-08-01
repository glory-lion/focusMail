from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from ..auth.dependencies import get_current_user
from ..db import get_session
from ..models import User
from ..notifications.scheduler import schedule_user_digest

router = APIRouter()


class SettingsUpdate(BaseModel):
    notification_preference: Optional[str] = None  # "immediate" | "daily"
    digest_hour: Optional[int] = None
    digest_minute: Optional[int] = None
    push_token: Optional[str] = None


@router.get("/settings")
def get_settings(user: User = Depends(get_current_user)):
    return {
        "notification_preference": user.notification_preference,
        "digest_hour": user.digest_hour,
        "digest_minute": user.digest_minute,
        "push_token": user.push_token,
    }


@router.put("/settings")
def update_settings(
    payload: SettingsUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if payload.notification_preference is not None:
        if payload.notification_preference not in ("immediate", "daily"):
            raise HTTPException(
                status_code=400,
                detail="notification_preference must be 'immediate' or 'daily'",
            )
        user.notification_preference = payload.notification_preference
    if payload.digest_hour is not None:
        user.digest_hour = payload.digest_hour
    if payload.digest_minute is not None:
        user.digest_minute = payload.digest_minute
    if payload.push_token is not None:
        user.push_token = payload.push_token

    session.add(user)
    session.commit()
    session.refresh(user)

    schedule_user_digest(user)

    return {"status": "updated"}
