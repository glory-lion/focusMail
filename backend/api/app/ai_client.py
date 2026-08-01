import httpx
from schema import Classification, NormalizedEmail

from .config import settings


def classify_and_summarize(email: NormalizedEmail) -> Classification:
    """Ask teammate B's ai-service to classify/summarize an email.

    Falls back to a rough local mock whenever that service isn't reachable
    (e.g. it hasn't been built yet), so the rest of the pipeline has
    something real to work with. Once B's service is running at
    AI_SERVICE_URL, this starts using it automatically — no code change
    needed here.
    """
    try:
        response = httpx.post(
            f"{settings.ai_service_url}/classify",
            json=email.model_dump(mode="json"),
            timeout=5.0,
        )
        response.raise_for_status()
        return Classification(**response.json())
    except httpx.HTTPError:
        return _mock_classify(email)


def _mock_classify(email: NormalizedEmail) -> Classification:
    text = f"{email.subject} {email.snippet}".lower()
    deadline_words = ["deadline", "due", "by tomorrow", "by monday", "urgent", "asap"]
    action_words = ["please", "can you", "action required", "respond", "review"]
    has_deadline = any(word in text for word in deadline_words)
    needs_action = any(word in text for word in action_words)
    urgency_score = min(
        100,
        (45 if needs_action else 10)
        + (40 if has_deadline else 0)
        + (5 if email.attachments else 0),
    )
    return Classification(
        needs_action=needs_action,
        has_deadline=has_deadline,
        is_important=needs_action and has_deadline,
        urgency_score=urgency_score,
        summary=email.snippet[:140],
    )
