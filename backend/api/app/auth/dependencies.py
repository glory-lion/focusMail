from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlmodel import Session, select

from ..db import get_session
from ..models import User


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ")
    user = session.exec(select(User).where(User.session_token == token)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session token")
    return user
