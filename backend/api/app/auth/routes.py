from urllib.parse import urlencode

from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from .. import ai_client
from ..config import settings
from ..db import get_session
from ..gmail import client as gmail_client
from ..models import EmailMessage, User
from . import oauth
from .dependencies import get_current_user

router = APIRouter()


def _frontend_redirect(**params: str) -> RedirectResponse:
    return RedirectResponse(f"{settings.frontend_url}/auth/callback?{urlencode(params)}")


@router.get("/auth/login")
def login():
    return RedirectResponse(oauth.build_login_url())


@router.get("/auth/callback")
def callback(code: str, state: str, session: Session = Depends(get_session)):
    credentials = oauth.exchange_code_for_tokens(state, code)
    if not credentials.refresh_token:
        return _frontend_redirect(
            error=(
                "Google didn't return a refresh token. This usually happens "
                "if you'd already approved this app before. Revoke access at "
                "https://myaccount.google.com/permissions and try connecting "
                "again."
            )
        )
    email = oauth.get_profile_email(credentials)

    user = session.exec(select(User).where(User.email == email)).first()
    is_new_user = user is None
    if user:
        user.refresh_token = credentials.refresh_token
    else:
        user = User(email=email, refresh_token=credentials.refresh_token)
    session.add(user)
    session.commit()
    session.refresh(user)

    if is_new_user:
        # One-time, at connect: extract how this user writes so reply
        # drafts sound like them. Best-effort — a failure here (Gmail
        # hiccup, ai-service down) shouldn't block the connect flow itself;
        # style_profile just stays None and classification falls back to a
        # generic tone until this succeeds on a later connect.
        try:
            sent_emails = gmail_client.fetch_sent_emails(user)
            profile = ai_client.build_style_profile(sent_emails)
            user.style_profile = profile.model_dump(mode="json")
            session.add(user)
            session.commit()
        except Exception:
            pass

    return _frontend_redirect(token=user.session_token, email=user.email)


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
