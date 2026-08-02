import httpx

from ..models import EmailMessage, User

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_push(push_token: str, title: str, body: str, data: dict | None = None) -> None:
    httpx.post(
        EXPO_PUSH_URL,
        json={"to": push_token, "title": title, "body": body, "data": data or {}},
        timeout=5.0,
    )


def send_immediate_notification(user: User, email: EmailMessage) -> None:
    if not user.push_token:
        return
    send_push(
        user.push_token,
        title="Important email",
        body=email.subject,
        data={"email_id": str(email.id), "gmail_link": email.gmail_link},
    )
