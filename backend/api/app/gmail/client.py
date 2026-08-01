import base64
from datetime import datetime, timezone
from email.mime.text import MIMEText
from html import unescape
from html.parser import HTMLParser

# We store and compare all timestamps as naive UTC (no attached tzinfo)
# because SQLite silently strips timezone info on read-back — mixing naive
# and aware datetimes later would raise a TypeError when comparing them.

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from schema import Attachment, NormalizedEmail

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


def _extract_attachments(payload: dict) -> list[Attachment]:
    attachments: list[Attachment] = []
    filename = payload.get("filename", "")
    body = payload.get("body", {})
    attachment_id = body.get("attachmentId")
    if filename and attachment_id:
        attachments.append(
            Attachment(
                attachment_id=attachment_id,
                filename=filename,
                mime_type=payload.get("mimeType", "application/octet-stream"),
                size=body.get("size", 0),
            )
        )
    for part in payload.get("parts", []):
        attachments.extend(_extract_attachments(part))
    return attachments


def _fetch_emails_by_label(
    user: User, label: str, max_results: int, query: str | None = None
) -> list[NormalizedEmail]:
    """Shared by fetch_recent_emails (INBOX) and fetch_sent_emails (SENT).

    Uses format="full" (not "metadata") so `body` is populated — the
    ai-service needs full body text for a real detailed summary,
    deadline/action-item extraction, reply draft, or style-profile
    extraction; snippet alone isn't enough for any of those. This doesn't
    add extra API calls (one .get() per message either way), just a bigger
    response per call. The MIME part tree in the "full" response is also
    what attachment metadata is extracted from below.

    `query` is a Gmail search query (e.g. "newer_than:7d") applied at the
    API level, so old mail is never fetched/stored in the first place —
    the daily discard job only cleans up what's already stored, it can't
    undo already having pulled in older content.
    """
    credentials = _credentials_from_user(user)
    service = build("gmail", "v1", credentials=credentials)

    list_kwargs = {"userId": "me", "maxResults": max_results, "labelIds": [label]}
    if query:
        list_kwargs["q"] = query

    listing = service.users().messages().list(**list_kwargs).execute()
    message_refs = listing.get("messages", [])

    emails: list[NormalizedEmail] = []
    for ref in message_refs:
        message = (
            service.users()
            .messages()
            .get(userId="me", id=ref["id"], format="full")
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
                body=_extract_body(message["payload"]),
                received_at=received_at,
                gmail_link=f"https://mail.google.com/mail/u/0/#inbox/{message['id']}",
                attachments=_extract_attachments(message["payload"]),
            )
        )
    return emails


def fetch_recent_emails(user: User, max_results: int = 20) -> list[NormalizedEmail]:
    """Fetch the most recent inbox messages for a user, newest first.

    Restricted to the retention window (settings.retention_days) at the
    Gmail query level — otherwise a low-volume inbox would reach arbitrarily
    far back to fill max_results, briefly storing content older than the
    retention policy promises until the next daily discard run catches it.

    Deliberately doesn't try to track 'since when' via Gmail's API itself —
    the poller decides what's actually new by checking what's already in our
    own database, which is simpler and avoids Gmail history-tracking edge
    cases for a first version.
    """
    return _fetch_emails_by_label(
        user, "INBOX", max_results, query=f"newer_than:{settings.retention_days}d"
    )


def fetch_sent_emails(user: User, max_results: int = 20) -> list[NormalizedEmail]:
    """Fetch the user's most recent sent messages, for style-profile
    extraction at connect time. Called once per (new) user — see
    auth/routes.py."""
    return _fetch_emails_by_label(user, "SENT", max_results)


def _find_mime_part(payload: dict, mime_type: str) -> str:
    """Depth-first search for a part with this exact mimeType (including
    the payload itself, for single-part messages with no `parts` list),
    returning its decoded raw content, or "" if not found."""
    if payload.get("mimeType") == mime_type:
        data = payload.get("body", {}).get("data")
        if data:
            return base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
    for part in payload.get("parts", []):
        text = _find_mime_part(part, mime_type)
        if text:
            return text
    return ""


def _extract_body(payload: dict) -> str:
    """Gmail messages are MIME, often multiple nested parts (plain text,
    HTML, attachments). Prefers HTML — converted to clean visible text via
    _html_to_text — over the sender's text/plain part: many senders'
    auto-generated plain-text fallbacks are lower quality (raw tracking
    URLs, "[image: Logo]" placeholders) than what we get by properly
    parsing their actual HTML ourselves. Falls back to text/plain only if
    no HTML part exists anywhere (including the payload's own top-level
    content type, for single-part HTML messages with no `parts` list).
    """
    html_content = _find_mime_part(payload, "text/html")
    if html_content:
        return _html_to_text(html_content)
    return _find_mime_part(payload, "text/plain")


class _BodyTextExtractor(HTMLParser):
    """Extracts visible text from HTML, skipping <script>/<style> content
    and all tag attributes (so href/src/tracking-link URLs never leak into
    the extracted text — only text actually rendered to the reader)."""

    _BLOCK_TAGS = {"br", "p", "div", "tr", "li", "h1", "h2", "h3", "h4", "h5", "h6"}

    def __init__(self) -> None:
        super().__init__()
        self._chunks: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in ("script", "style"):
            self._skip_depth += 1
        elif tag in self._BLOCK_TAGS:
            self._chunks.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in ("script", "style") and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._skip_depth == 0 and data.strip():
            self._chunks.append(data)

    def text(self) -> str:
        lines = [line.strip() for line in "".join(self._chunks).splitlines()]
        return "\n".join(line for line in lines if line)


def _html_to_text(html_content: str) -> str:
    parser = _BodyTextExtractor()
    parser.feed(html_content)
    return unescape(parser.text())


def fetch_body(user: User, gmail_id: str) -> str:
    """Fetches the full body of one message, live, on demand.

    Deliberately not called during polling and never stored in our
    database — only pulled when a user actually opens this specific email.
    """
    credentials = _credentials_from_user(user)
    service = build("gmail", "v1", credentials=credentials)
    message = (
        service.users().messages().get(userId="me", id=gmail_id, format="full").execute()
    )
    return _extract_body(message["payload"])


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
