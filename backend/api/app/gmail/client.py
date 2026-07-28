import base64
from datetime import datetime, timezone
from email.mime.text import MIMEText

# We store and compare all timestamps as naive UTC (no attached tzinfo)
# because SQLite silently strips timezone info on read-back — mixing naive
# and aware datetimes later would raise a TypeError when comparing them.

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from schema import NormalizedEmail

from ..config import settings
from ..models import EmailMessage, User


def _credentials_from_user(user: User) -> Credentials:
    # We only ever stored the refresh_token, not an access_token — that's
    # fine, this object will silently use the refresh_token to get a fresh
    # short-lived access_token the first time it's actually used.
    return Credentials(
        token=None,
        refresh_token=user.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
    )


def _header(headers: list[dict], name: str) -> str:
    for header in headers:
        if header["name"].lower() == name.lower():
            return header["value"]
    return ""


def fetch_recent_emails(user: User, max_results: int = 20) -> list[NormalizedEmail]:
    """Fetch the most recent inbox messages for a user, newest first.

    Deliberately doesn't try to track 'since when' via Gmail's API itself —
    the poller decides what's actually new by checking what's already in our
    own database, which is simpler and avoids Gmail history-tracking edge
    cases for a first version.
    """
    credentials = _credentials_from_user(user)
    service = build("gmail", "v1", credentials=credentials)

    listing = (
        service.users()
        .messages()
        .list(userId="me", maxResults=max_results, labelIds=["INBOX"])
        .execute()
    )
    message_refs = listing.get("messages", [])

    emails: list[NormalizedEmail] = []
    for ref in message_refs:
        message = (
            service.users()
            .messages()
            .get(
                userId="me",
                id=ref["id"],
                format="metadata",
                metadataHeaders=["From", "Subject", "Date"],
            )
            .execute()
        )
        headers = message["payload"]["headers"]
        received_at = datetime.fromtimestamp(
            int(message["internalDate"]) / 1000, tz=timezone.utc
        ).replace(tzinfo=None)
        emails.append(
            NormalizedEmail(
                gmail_id=message["id"],
                thread_id=message["threadId"],
                sender=_header(headers, "From"),
                subject=_header(headers, "Subject"),
                snippet=message.get("snippet", ""),
                received_at=received_at,
                gmail_link=f"https://mail.google.com/mail/u/0/#inbox/{message['id']}",
            )
        )
    return emails


def send_reply(user: User, email: EmailMessage, body_text: str) -> None:
    """Sends a reply in an existing thread. Only ever called from an explicit,
    per-email user action (the in-app Send button) — never from the poller.
    """
    credentials = _credentials_from_user(user)
    service = build("gmail", "v1", credentials=credentials)

    subject = email.subject
    if not subject.lower().startswith("re:"):
        subject = f"Re: {subject}"

    message = MIMEText(body_text)
    message["To"] = email.sender
    message["Subject"] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

    service.users().messages().send(
        userId="me", body={"raw": raw, "threadId": email.thread_id}
    ).execute()
