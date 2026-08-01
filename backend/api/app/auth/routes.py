from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from ..db import get_session
from ..models import EmailMessage, User
from . import oauth
from .dependencies import get_current_user

router = APIRouter()


@router.get("/auth/login")
def login():
    return RedirectResponse(oauth.build_login_url())


@router.get("/auth/callback")
def callback(code: str, state: str, session: Session = Depends(get_session)):
    credentials = oauth.exchange_code_for_tokens(state, code)
    if not credentials.refresh_token:
        raise HTTPException(
            status_code=400,
            detail=(
                "Google didn't return a refresh token. This usually happens "
                "if you'd already approved this app before. Revoke access at "
                "https://myaccount.google.com/permissions and try "
                "/auth/login again."
            ),
        )
    email = oauth.get_profile_email(credentials)

    user = session.exec(select(User).where(User.email == email)).first()
    if user:
        user.refresh_token = credentials.refresh_token
    else:
        user = User(email=email, refresh_token=credentials.refresh_token)
    session.add(user)
    session.commit()
    session.refresh(user)

    return {
        "status": "connected",
        "email": user.email,
        "session_token": user.session_token,
    }


@router.delete("/account")
def delete_account(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    emails = session.exec(
        select(EmailMessage).where(EmailMessage.user_id == user.id)
    ).all()
    for email in emails:
        session.delete(email)
    session.delete(user)
    session.commit()
    return {"status": "deleted"}
