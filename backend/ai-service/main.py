"""FastAPI HTTP layer exposing the AI pipeline to backend/api (see
README.md — Endpoints).

Request/response bodies use the shared domain types from shared/schema.py
(NormalizedEmail, Classification, ActionItem, StyleProfile) so this service
and backend/api can never drift apart on field names again — both import
the same file. Internally, classify.py/summarize.py/action_items.py/
reply_draft.py use their own plain-dict shape (an implementation detail);
the functions below are the adapter between that and the shared schema.

- POST /classify-batch: takes a batch of raw emails (any size — a 1-5 email
  steady-state poll or a 100+ email onboarding sweep) plus the cached
  style_profile from /style-profile (omit to fall back to a generic
  neutral profile). Returns one Classification per email, same order as
  the request.
- POST /style-profile: one-time call per user at connect time, alongside
  the backlog sweep. Takes the user's sent emails, returns a style profile
  to cache and pass into every subsequent /classify-batch call.
"""

from typing import Optional

from fastapi import FastAPI
from pydantic import BaseModel
from schema import ActionItem, Classification, NormalizedEmail, StyleProfile

from batch import classify_batch_full
from style_profile import extract_style_profile

app = FastAPI(title="ai-service")


class ClassifyBatchRequest(BaseModel):
    emails: list[NormalizedEmail]
    style_profile: Optional[StyleProfile] = None


class ClassifyBatchResponse(BaseModel):
    results: list[Classification]  # same order as request.emails


class StyleProfileRequest(BaseModel):
    sent_emails: list[NormalizedEmail]


class StyleProfileResponse(BaseModel):
    profile: StyleProfile


def _email_to_internal(email: NormalizedEmail) -> dict:
    # gmail_id doubles as our internal "id" — NormalizedEmail has no id of
    # its own (that's assigned by Person A's DB, after classification runs).
    # Falls back to snippet if body wasn't populated, rather than failing —
    # lower-quality classification beats none.
    return {
        "id": email.gmail_id,
        "subject": email.subject,
        "body": email.body or email.snippet,
        "received_at": email.received_at.isoformat(),
    }


def _style_profile_to_internal(profile: StyleProfile) -> dict:
    return {
        "formality": profile.formality,
        "avgLength": profile.avg_length,
        "usesContractions": profile.uses_contractions,
        "greeting": profile.greeting,
        "signOff": profile.sign_off,
        "quirks": profile.quirks,
    }


def _internal_to_style_profile(profile: dict) -> StyleProfile:
    return StyleProfile(
        formality=profile["formality"],
        avg_length=profile["avgLength"],
        uses_contractions=profile["usesContractions"],
        greeting=profile["greeting"],
        sign_off=profile["signOff"],
        quirks=profile["quirks"],
    )


def _result_to_classification(result: dict) -> Classification:
    return Classification(
        is_important=result["important"],
        urgency_score=result["urgencyScore"],
        summary_short=result["summaryShort"],
        summary_detailed=result["summaryDetailed"],
        deadline=result["deadline"],
        action_items=[
            ActionItem(id=item["id"], text=item["text"], due_date=item["dueDate"])
            for item in result["actionItems"]
        ],
        suggested_reply=result["suggestedReply"],
        reply_contains_commitment=result["containsCommitment"],
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/classify-batch", response_model=ClassifyBatchResponse)
def classify_batch_endpoint(request: ClassifyBatchRequest) -> ClassifyBatchResponse:
    emails = [_email_to_internal(e) for e in request.emails]
    style_profile = (
        _style_profile_to_internal(request.style_profile) if request.style_profile else None
    )

    results = classify_batch_full(emails, style_profile)
    return ClassifyBatchResponse(results=[_result_to_classification(r) for r in results])


@app.post("/style-profile", response_model=StyleProfileResponse)
def style_profile_endpoint(request: StyleProfileRequest) -> StyleProfileResponse:
    sent_emails = [_email_to_internal(e) for e in request.sent_emails]
    profile = extract_style_profile(sent_emails)
    return StyleProfileResponse(profile=_internal_to_style_profile(profile))
