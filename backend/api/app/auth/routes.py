import secrets
import time
from typing import Literal
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlmodel import Session, select

from .. import ai_client
from ..config import settings
from ..db import get_session
from ..gmail import client as gmail_client
from ..models import EmailMessage, User
from . import oauth
from .dependencies import get_current_user

router = APIRouter()
_native_exchange_codes: dict[str, tuple[str, str, float]] = {}


def _frontend_redirect(**params: str) -> RedirectResponse:
    return RedirectResponse(f"{settings.frontend_url}/auth/callback?{urlencode(params)}")


@router.get("/auth/login")
def login(platform: Literal["web", "native"] = "web"):
    return RedirectResponse(oauth.build_login_url(native=platform == "native"))


@router.get("/auth/callback")
def callback(code: str, state: str, session: Session = Depends(get_session)):
    try:
        credentials, native = oauth.exchange_code_for_tokens(state, code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
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

    if native:
        exchange_code = secrets.token_urlsafe(32)
        _native_exchange_codes[exchange_code] = (user.session_token, user.email, time.time() + 300)
        query = urlencode({"code": exchange_code})
        return RedirectResponse(f"{settings.app_redirect_uri}?{query}")
    return _frontend_redirect(token=user.session_token, email=user.email)


class NativeExchangeRequest(BaseModel):
    code: str


@router.post("/auth/native/exchange")
def exchange_native_code(payload: NativeExchangeRequest):
    pending = _native_exchange_codes.pop(payload.code, None)
    if pending is None or pending[2] < time.time():
        raise HTTPException(status_code=400, detail="Invalid or expired exchange code")
    session_token, email, _expires_at = pending
    return {"session_token": session_token, "email": email}


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
