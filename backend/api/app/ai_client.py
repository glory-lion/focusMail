

from typing import Optional

import httpx
from schema import Classification, NormalizedEmail, StyleProfile

from .config import settings


def classify_and_summarize_batch(
    emails: list[NormalizedEmail], style_profile: Optional[StyleProfile] = None
) -> list[Classification]:
    """Ask teammate B's ai-service to classify/summarize a batch of emails —
    same call shape whether it's one new email from a poll cycle or a
    100+ email backlog sweep; the ai-service handles concurrency
    internally. Returns results in the same order as `emails`.

    Falls back to a rough local mock whenever that service isn't reachable
    (e.g. it hasn't been built yet), so the rest of the pipeline has
    something real to work with. Once B's service is running at
    AI_SERVICE_URL, this starts using it automatically — no code change
    needed here.
    """
    if not emails:
        return []

    try:
        response = httpx.post(
            f"{settings.ai_service_url}/classify-batch",
            json={
                "emails": [e.model_dump(mode="json") for e in emails],
                "style_profile": style_profile.model_dump(mode="json") if style_profile else None,
            },
            timeout=60.0,
        )
        response.raise_for_status()
        return [Classification(**result) for result in response.json()["results"]]
    except httpx.HTTPError:
        return [_mock_classify(email) for email in emails]


def build_style_profile(sent_emails: list[NormalizedEmail]) -> StyleProfile:
    """Ask the ai-service to extract a style profile from the user's sent
    mail. Called once per (new) user at connect time — see auth/routes.py.
    Safe to call with zero or few sent emails; the ai-service falls back
    to a generic neutral profile below its own cold-start threshold.

    Falls back to a generic default locally if the ai-service isn't
    reachable, same pattern as classify_and_summarize_batch.
    """
    try:
        response = httpx.post(
            f"{settings.ai_service_url}/style-profile",
            json={"sent_emails": [e.model_dump(mode="json") for e in sent_emails]},
            timeout=60.0,
        )
        response.raise_for_status()
        return StyleProfile(**response.json()["profile"])
    except httpx.HTTPError:
        return StyleProfile(
            formality="neutral",
            avg_length="medium",
            uses_contractions=True,
            greeting="casual",
            sign_off="Thanks,",
            quirks="",
        )


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
        is_important=needs_action and has_deadline,
        urgency_score=urgency_score,
        summary_short=email.snippet[:140],
        summary_detailed=email.snippet,
        deadline=None,
        action_items=[],
        suggested_reply="",
    )
